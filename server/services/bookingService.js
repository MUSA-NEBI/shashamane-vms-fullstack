/**
 * bookingService.js
 * Handles seat reservation with concurrency safety.
 * 
 * CONCURRENCY DESIGN:
 * We use a MongoDB findOneAndUpdate with a conditional query:
 *   - Only updates if seatNumber is NOT already in bookedSeats
 *   - This is an atomic operation — MongoDB guarantees only one update succeeds
 *     when two concurrent requests try to book the same seat
 * For replica sets, we wrap in a session/transaction.
 * For standalone MongoDB (dev), the conditional update still prevents double-booking.
 */

const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const generateReference = require('../utils/generateReference');
const { AppError } = require('../middleware/errorHandler');
const { BOOKING_STATUS, SCHEDULE_STATUS } = require('../config/constants');
const { notifyBookingConfirmed, notifyBookingCancelled } = require('./notificationService');

/**
 * Reserve a seat on a schedule for a passenger.
 * Returns the created Booking document.
 */
const reserveSeat = async (passengerId, scheduleId, seatNumber) => {
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      // 1. Lock and validate the schedule
      const schedule = await Schedule.findById(scheduleId)
        .populate('vehicle')
        .session(session);

      if (!schedule) {
        throw new AppError('Schedule not found.', 404);
      }

      if (schedule.status !== SCHEDULE_STATUS.SCHEDULED && schedule.status !== SCHEDULE_STATUS.BOARDING) {
        throw new AppError(`Cannot book a trip with status: ${schedule.status}.`, 400);
      }

      if (schedule.departureTime <= new Date()) {
        throw new AppError('Cannot book a trip that has already departed.', 400);
      }

      const capacity = schedule.vehicle?.capacity;
      if (!capacity) {
        throw new AppError('Vehicle capacity information is unavailable.', 500);
      }

      if (seatNumber < 1 || seatNumber > capacity) {
        throw new AppError(`Seat number must be between 1 and ${capacity}.`, 400);
      }

      // 2. Atomic seat reservation: add seatNumber ONLY if not already present
      const updated = await Schedule.findOneAndUpdate(
        {
          _id: scheduleId,
          bookedSeats: { $not: { $elemMatch: { $eq: seatNumber } } }, // seat must be free
        },
        { $addToSet: { bookedSeats: seatNumber } },
        { new: true, session }
      );

      if (!updated) {
        throw new AppError('This seat has already been booked. Please choose another seat.', 409);
      }

      // 3. Check for existing booking (passenger already booked this trip)
      const existingBooking = await Booking.findOne({
        passenger: passengerId,
        schedule: scheduleId,
        status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
      }).session(session);

      if (existingBooking) {
        // Roll back the seat reservation
        await Schedule.findByIdAndUpdate(
          scheduleId,
          { $pull: { bookedSeats: seatNumber } },
          { session }
        );
        throw new AppError('You already have an active booking on this trip.', 409);
      }

      // 4. Create the booking record
      const bookingReference = generateReference('BK');
      booking = await Booking.create(
        [
          {
            bookingReference,
            passenger: passengerId,
            schedule: scheduleId,
            seatNumber,
            status: BOOKING_STATUS.PENDING,
            fareAmount: updated.fare,
          },
        ],
        { session }
      );

      booking = booking[0];
    });

    // 5. Fire non-blocking notification
    notifyBookingConfirmed(passengerId, booking.bookingReference, `Schedule ${scheduleId}`);

    return booking;
  } catch (err) {
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel a booking. Releases the seat back to the schedule.
 * Passengers can only cancel their own bookings.
 * Admins can cancel any booking.
 */
const cancelBooking = async (bookingId, cancelledBy, reason, isAdmin = false) => {
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      booking = await Booking.findById(bookingId).session(session);

      if (!booking) {
        throw new AppError('Booking not found.', 404);
      }

      // Ownership check for non-admins
      if (!isAdmin && booking.passenger.toString() !== cancelledBy.toString()) {
        throw new AppError('You are not authorized to cancel this booking.', 403);
      }

      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new AppError('This booking is already cancelled.', 400);
      }

      if (booking.status === BOOKING_STATUS.COMPLETED) {
        throw new AppError('Completed bookings cannot be cancelled.', 400);
      }

      // Release the seat
      await Schedule.findByIdAndUpdate(
        booking.schedule,
        { $pull: { bookedSeats: booking.seatNumber } },
        { session }
      );

      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancelledBy = cancelledBy;
      booking.cancellationReason = reason;
      await booking.save({ session });
    });

    notifyBookingCancelled(booking.passenger, booking.bookingReference);

    return booking;
  } catch (err) {
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { reserveSeat, cancelBooking };
