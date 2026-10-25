/**
 * scheduleController.js
 */

const Schedule = require('../models/Schedule');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { SCHEDULE_STATUS, VEHICLE_STATUS, DRIVER_STATUS } = require('../config/constants');

/**
 * Check for conflicting vehicle or driver assignment in a time window.
 * A conflict exists if the same vehicle/driver is already assigned to an
 * overlapping schedule.
 */
const checkConflicts = async (vehicleId, driverId, departureTime, arrivalTime, excludeId = null) => {
  const overlap = {
    status: { $nin: [SCHEDULE_STATUS.CANCELLED, SCHEDULE_STATUS.COMPLETED] },
    $or: [
      // New window starts during an existing one
      { departureTime: { $lt: arrivalTime }, arrivalTime: { $gt: departureTime } },
    ],
  };

  if (excludeId) overlap._id = { $ne: excludeId };

  const vehicleConflict = await Schedule.findOne({ ...overlap, vehicle: vehicleId });
  if (vehicleConflict) {
    throw new AppError(
      `Vehicle conflict: this vehicle is already assigned to a trip departing at ${vehicleConflict.departureTime}.`,
      409
    );
  }

  const driverConflict = await Schedule.findOne({ ...overlap, driver: driverId });
  if (driverConflict) {
    throw new AppError(
      `Driver conflict: this driver is already assigned to a trip departing at ${driverConflict.departureTime}.`,
      409
    );
  }
};

// GET /api/schedules
const getSchedules = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, route, date, upcoming } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (route) filter.route = route;
    if (upcoming === 'true') filter.departureTime = { $gte: new Date() };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: start, $lte: end };
    }

    const [schedules, total] = await Promise.all([
      Schedule.find(filter)
        .populate('route', 'routeName origin destination totalDistance baseFare')
        .populate('vehicle', 'vehicleCode plateNumber capacity model manufacturer')
        .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } })
        .sort({ departureTime: 1 })
        .skip(skip)
        .limit(limit),
      Schedule.countDocuments(filter),
    ]);

    return sendPaginated(res, schedules, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/search  — passenger trip search
const searchSchedules = async (req, res, next) => {
  try {
    const { origin, destination, date, seats = 1 } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    if (!origin || !destination || !date) {
      throw new AppError('Origin, destination, and date are required for trip search.', 400);
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Find routes matching origin/destination
    const Route = require('../models/Route');
    const routes = await Route.find({
      origin: { $regex: origin, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      isActive: true,
    }).select('_id');

    const routeIds = routes.map((r) => r._id);

    const filter = {
      route: { $in: routeIds },
      departureTime: { $gte: start, $lte: end },
      status: { $in: [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.BOARDING] },
    };

    const [schedules, total] = await Promise.all([
      Schedule.find(filter)
        .populate('route', 'routeName origin destination estimatedDuration baseFare')
        .populate('vehicle', 'vehicleCode capacity model manufacturer')
        .sort({ departureTime: 1 })
        .skip(skip)
        .limit(limit),
      Schedule.countDocuments(filter),
    ]);

    // Add available seats info
    const schedulesWithAvailability = schedules.map((s) => {
      const obj = s.toObject();
      obj.availableSeats = s.vehicle ? s.vehicle.capacity - s.bookedSeats.length : null;
      obj.requestedSeats = parseInt(seats, 10);
      return obj;
    });

    return sendPaginated(
      res,
      schedulesWithAvailability.filter((s) => s.availableSeats >= parseInt(seats, 10)),
      buildPaginationMeta(total, page, limit)
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/:id
const getSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('route')
      .populate('vehicle', 'vehicleCode plateNumber capacity model manufacturer color')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } });

    if (!schedule) throw new AppError('Schedule not found.', 404);
    return sendSuccess(res, { data: schedule });
  } catch (err) {
    next(err);
  }
};

// POST /api/schedules
const createSchedule = async (req, res, next) => {
  try {
    const { route, vehicle, driver, departureTime, arrivalTime, fare, notes } = req.body;

    // Validate vehicle is active
    const veh = await Vehicle.findById(vehicle);
    if (!veh) throw new AppError('Vehicle not found.', 404);
    if (veh.status === VEHICLE_STATUS.MAINTENANCE) {
      throw new AppError('Vehicle is currently under maintenance and cannot be scheduled.', 409);
    }
    if (veh.status !== VEHICLE_STATUS.ACTIVE) {
      throw new AppError('Only active vehicles can be scheduled.', 409);
    }

    // Validate driver is active
    const drv = await Driver.findById(driver);
    if (!drv) throw new AppError('Driver not found.', 404);
    if (drv.status !== DRIVER_STATUS.ACTIVE) {
      throw new AppError('Only active drivers can be scheduled.', 409);
    }

    await checkConflicts(vehicle, driver, new Date(departureTime), new Date(arrivalTime));

    const schedule = await Schedule.create({ route, vehicle, driver, departureTime, arrivalTime, fare, notes });
    const populated = await Schedule.findById(schedule._id)
      .populate('route', 'routeName origin destination')
      .populate('vehicle', 'vehicleCode plateNumber capacity')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } });

    // Fire notification to driver
    const { notifyTripAssigned } = require('../services/notificationService');
    notifyTripAssigned(drv.user, `${populated.route?.routeName} on ${new Date(departureTime).toLocaleDateString()}`);

    return sendSuccess(res, { data: populated }, 'Schedule created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/schedules/:id
const updateSchedule = async (req, res, next) => {
  try {
    const { vehicle, driver, departureTime, arrivalTime } = req.body;
    const existing = await Schedule.findById(req.params.id);
    if (!existing) throw new AppError('Schedule not found.', 404);

    if (existing.status === SCHEDULE_STATUS.COMPLETED || existing.status === SCHEDULE_STATUS.CANCELLED) {
      throw new AppError('Cannot modify a completed or cancelled schedule.', 400);
    }

    const newVehicle = vehicle || existing.vehicle.toString();
    const newDriver = driver || existing.driver.toString();
    const newDep = departureTime ? new Date(departureTime) : existing.departureTime;
    const newArr = arrivalTime ? new Date(arrivalTime) : existing.arrivalTime;

    if (vehicle || driver || departureTime || arrivalTime) {
      await checkConflicts(newVehicle, newDriver, newDep, newArr, req.params.id);
    }

    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('route', 'routeName origin destination')
      .populate('vehicle', 'vehicleCode plateNumber capacity')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } });

    return sendSuccess(res, { data: schedule }, 'Schedule updated successfully.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/schedules/:id
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) throw new AppError('Schedule not found.', 404);

    const Booking = require('../models/Booking');
    const activeBookings = await Booking.countDocuments({
      schedule: req.params.id,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings > 0) {
      throw new AppError(
        `Cannot delete schedule: ${activeBookings} active booking(s) exist. Cancel them first.`,
        409
      );
    }

    await Schedule.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      status: SCHEDULE_STATUS.CANCELLED,
    });

    return sendSuccess(res, {}, 'Schedule cancelled and removed successfully.');
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/:id/seats  — get seat availability map for a schedule
const getSeatMap = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id).populate('vehicle', 'capacity');
    if (!schedule) throw new AppError('Schedule not found.', 404);

    const capacity = schedule.vehicle?.capacity || 0;
    const seats = Array.from({ length: capacity }, (_, i) => ({
      seatNumber: i + 1,
      isBooked: schedule.bookedSeats.includes(i + 1),
    }));

    return sendSuccess(res, {
      data: {
        scheduleId: schedule._id,
        capacity,
        bookedCount: schedule.bookedSeats.length,
        availableCount: capacity - schedule.bookedSeats.length,
        seats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/schedules/generate-from-template
const generateFromTemplate = async (req, res, next) => {
  try {
    const { templateId, fromDate, toDate } = req.body;
    if (!templateId || !fromDate || !toDate) {
      throw new AppError('templateId, fromDate, and toDate are required.', 400);
    }

    const template = await ScheduleTemplate.findById(templateId);
    if (!template || !template.isActive) throw new AppError('Template not found or inactive.', 404);

    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (end <= start) throw new AppError('toDate must be after fromDate.', 400);

    const created = [];
    const skipped = [];
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();

      if (template.daysOfWeek.includes(dayOfWeek)) {
        const [hours, minutes] = template.departureTime.split(':').map(Number);
        const departure = new Date(current);
        departure.setHours(hours, minutes, 0, 0);
        const arrival = new Date(departure.getTime() + template.durationMinutes * 60000);

        // Idempotency: skip if a schedule already exists from this template on this date
        const exists = await Schedule.findOne({
          templateId: template._id,
          departureTime: departure,
        });

        if (exists) {
          skipped.push(departure.toISOString());
        } else {
          try {
            await checkConflicts(template.vehicle, template.driver, departure, arrival);
            const schedule = await Schedule.create({
              route: template.route,
              vehicle: template.vehicle,
              driver: template.driver,
              departureTime: departure,
              arrivalTime: arrival,
              fare: template.fare,
              templateId: template._id,
            });
            created.push(schedule._id);
          } catch (conflictErr) {
            skipped.push(`${departure.toISOString()} (conflict: ${conflictErr.message})`);
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return sendSuccess(res, {
      data: { created: created.length, skipped: skipped.length, skippedDetails: skipped },
    }, `Generated ${created.length} schedule(s). Skipped ${skipped.length}.`);
  } catch (err) {
    next(err);
  }
};

// GET /api/schedules/available-dates — get dates with available schedules for origin/destination
const getAvailableDates = async (req, res, next) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      throw new AppError('Origin and destination are required.', 400);
    }

    // Find routes matching origin/destination
    const Route = require('../models/Route');
    const routes = await Route.find({
      origin: { $regex: origin, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      isActive: true,
    }).select('_id');

    const routeIds = routes.map((r) => r._id);

    if (routeIds.length === 0) {
      return sendSuccess(res, { data: [] });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Find all schedules for these routes in the future
    const schedules = await Schedule.find({
      route: { $in: routeIds },
      departureTime: { $gte: now },
      status: { $in: [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.BOARDING] },
    })
    .populate('vehicle', 'capacity')
    .select('departureTime bookedSeats vehicle')
    .sort({ departureTime: 1 })
    .limit(365); // Max 1 year ahead

    // Group by date and check if any schedule has available seats
    const dateMap = {};
    schedules.forEach((schedule) => {
      const dateKey = schedule.departureTime.toISOString().split('T')[0];
      const availableSeats = schedule.vehicle ? schedule.vehicle.capacity - schedule.bookedSeats.length : 0;
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          hasAvailability: availableSeats > 0,
          scheduleCount: 1,
        };
      } else {
        dateMap[dateKey].scheduleCount++;
        if (availableSeats > 0) {
          dateMap[dateKey].hasAvailability = true;
        }
      }
    });

    // Return only dates with availability
    const availableDates = Object.values(dateMap)
      .filter(d => d.hasAvailability)
      .map(d => d.date);

    return sendSuccess(res, { data: availableDates });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchedules,
  searchSchedules,
  getAvailableDates,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSeatMap,
  generateFromTemplate,
};
