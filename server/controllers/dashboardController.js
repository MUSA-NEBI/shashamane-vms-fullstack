/**
 * dashboardController.js
 * All stats come from real MongoDB aggregations.
 */

const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/apiResponse');
const { VEHICLE_STATUS, DRIVER_STATUS, BOOKING_STATUS, PAYMENT_STATUS, MAINTENANCE_STATUS, SCHEDULE_STATUS } = require('../config/constants');

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalVehicles, activeVehicles, maintenanceVehicles,
      totalDrivers, activeDrivers,
      upcomingSchedules,
      totalBookings, confirmedBookings, pendingBookings,
      totalRevenue,
      pendingMaintenance,
      recentBookings,
      bookingsByDay,
      revenueByMonth,
    ] = await Promise.all([
      Vehicle.countDocuments({}),
      Vehicle.countDocuments({ status: VEHICLE_STATUS.ACTIVE }),
      Vehicle.countDocuments({ status: VEHICLE_STATUS.MAINTENANCE }),
      Driver.countDocuments({}),
      Driver.countDocuments({ status: DRIVER_STATUS.ACTIVE }),
      Schedule.countDocuments({ departureTime: { $gte: now, $lte: sevenDaysAhead }, status: SCHEDULE_STATUS.SCHEDULED }),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: BOOKING_STATUS.CONFIRMED }),
      Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      MaintenanceRecord.countDocuments({ status: { $in: [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.IN_PROGRESS] } }),
      Booking.find({})
        .populate('passenger', 'firstName lastName')
        .populate({ path: 'schedule', populate: { path: 'route', select: 'origin destination' } })
        .sort({ createdAt: -1 })
        .limit(5),
      // Bookings per day for the last 30 days
      Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Revenue per month for last 6 months
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.COMPLETED, paidAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return sendSuccess(res, {
      data: {
        vehicles: { total: totalVehicles, active: activeVehicles, maintenance: maintenanceVehicles, inactive: totalVehicles - activeVehicles - maintenanceVehicles },
        drivers: { total: totalDrivers, active: activeDrivers },
        schedules: { upcomingThisWeek: upcomingSchedules },
        bookings: { total: totalBookings, confirmed: confirmedBookings, pending: pendingBookings },
        revenue: { total: totalRevenue[0]?.total || 0, currency: 'ETB' },
        maintenance: { pending: pendingMaintenance },
        recentBookings,
        charts: {
          bookingsByDay,
          revenueByMonth,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/dispatcher
const getDispatcherDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const [todaySchedules, availableVehicles, availableDrivers, pendingBookings] = await Promise.all([
      Schedule.find({ departureTime: { $gte: todayStart, $lte: todayEnd } })
        .populate('route', 'origin destination')
        .populate('vehicle', 'vehicleCode plateNumber')
        .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
        .sort({ departureTime: 1 }),
      Vehicle.countDocuments({ status: VEHICLE_STATUS.ACTIVE }),
      Driver.countDocuments({ status: DRIVER_STATUS.ACTIVE }),
      Booking.countDocuments({ status: BOOKING_STATUS.PENDING }),
    ]);

    return sendSuccess(res, {
      data: { todaySchedules, availableVehicles, availableDrivers, pendingBookings },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/driver  — driver sees their own upcoming trips
const getDriverDashboard = async (req, res, next) => {
  try {
    const Driver = require('../models/Driver');
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) return sendSuccess(res, { data: { trips: [], totalTrips: 0 } });

    const now = new Date();
    const trips = await Schedule.find({
      driver: driver._id,
      departureTime: { $gte: now },
      status: { $in: [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.BOARDING] },
    })
      .populate('route', 'routeName origin destination estimatedDuration')
      .populate('vehicle', 'vehicleCode plateNumber model capacity')
      .sort({ departureTime: 1 })
      .limit(10);

    const totalTrips = await Schedule.countDocuments({
      driver: driver._id,
      status: SCHEDULE_STATUS.COMPLETED,
    });

    return sendSuccess(res, { data: { trips, totalTrips, driverProfile: driver } });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/passenger
const getPassengerDashboard = async (req, res, next) => {
  try {
    const [recentBookings, totalBookings, upcomingTrips] = await Promise.all([
      Booking.find({ passenger: req.user._id })
        .populate({
          path: 'schedule',
          populate: { path: 'route', select: 'origin destination' },
        })
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.countDocuments({ passenger: req.user._id }),
      Booking.find({
        passenger: req.user._id,
        status: BOOKING_STATUS.CONFIRMED,
      })
        .populate({
          path: 'schedule',
          match: { departureTime: { $gte: new Date() } },
          populate: { path: 'route', select: 'routeName origin destination' },
        })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return sendSuccess(res, {
      data: {
        recentBookings,
        totalBookings,
        upcomingTrips: upcomingTrips.filter((b) => b.schedule),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/admin/users  — user management
const getUsersList = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { getPagination, buildPaginationMeta } = require('../utils/pagination');
    const { page, limit, skip } = getPagination(req.query);
    const { role, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const { sendPaginated } = require('../utils/apiResponse');
    return sendPaginated(res, users, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/dashboard/admin/users/:id/toggle-status
const toggleUserStatus = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found.', 404);

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { data: { isActive: user.isActive } },
      `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`);
  } catch (err) {
    next(err);
  }
};

// POST /api/dashboard/admin/users — create new user
const createUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { hashPassword } = require('../services/authService');
    const { firstName, lastName, email, phone, password, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      throw new AppError('All fields are required.', 400);
    }

    // Validate role
    const validRoles = ['admin', 'dispatcher', 'driver', 'passenger'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role.', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already exists.', 400);
    }

    // Hash password using argon2 (same as registration)
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role,
      isActive: true,
    });

    // If role is driver, create driver profile
    if (role === 'driver') {
      const Driver = require('../models/Driver');
      await Driver.create({
        user: user._id,
        licenseNumber: phone || 'PENDING',
        status: DRIVER_STATUS.ACTIVE,
      });
    }

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    return sendSuccess(res, { data: userResponse }, 'User created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

const { AppError } = require('../middleware/errorHandler');
module.exports = { getAdminDashboard, getDispatcherDashboard, getDriverDashboard, getPassengerDashboard, getUsersList, toggleUserStatus, createUser };
