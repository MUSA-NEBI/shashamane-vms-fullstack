/**
 * driverController.js
 */

const Driver = require('../models/Driver');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { SCHEDULE_STATUS, DRIVER_STATUS, ROLES } = require('../config/constants');
const authService = require('../services/authService');

// GET /api/drivers
const getDrivers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;

    // If searching, find matching users first
    let userFilter = {};
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
        role: ROLES.DRIVER,
      }).select('_id');
      const userIds = users.map((u) => u._id);
      filter.$or = [
        { user: { $in: userIds } },
        { employeeId: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .populate('user', 'firstName lastName email phone isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter),
    ]);

    return sendPaginated(res, drivers, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/drivers/:id
const getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate('user', 'firstName lastName email phone isActive createdAt');
    if (!driver) throw new AppError('Driver not found.', 404);
    return sendSuccess(res, { data: driver });
  } catch (err) {
    next(err);
  }
};

// POST /api/drivers  — creates both a User (role=driver) and a Driver profile
const createDriver = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, phone, password,
      employeeId, licenseNumber, licenseClass, licenseExpiry,
      dateOfBirth, yearsOfExperience, emergencyContact, notes,
    } = req.body;

    // Create user account
    const user = await authService.createUserByAdmin({
      firstName, lastName, email, phone, password, role: ROLES.DRIVER,
    });

    // Create driver profile
    const driver = await Driver.create({
      user: user._id,
      employeeId,
      licenseNumber,
      licenseClass,
      licenseExpiry,
      dateOfBirth,
      yearsOfExperience,
      emergencyContact,
      notes,
    });

    const populated = await Driver.findById(driver._id)
      .populate('user', 'firstName lastName email phone');

    return sendSuccess(res, { data: populated }, 'Driver created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/drivers/:id
const updateDriver = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, ...driverFields } = req.body;

    // Update user fields if provided
    const driver = await Driver.findById(req.params.id).populate('user');
    if (!driver) throw new AppError('Driver not found.', 404);

    if (firstName || lastName || phone) {
      const user = await User.findById(driver.user._id);
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      await user.save();
    }

    // Update driver profile fields (prevent user reference change)
    delete driverFields.user;
    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, driverFields, {
      new: true,
      runValidators: true,
    }).populate('user', 'firstName lastName email phone isActive');

    return sendSuccess(res, { data: updatedDriver }, 'Driver updated successfully.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/drivers/:id — soft delete
const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) throw new AppError('Driver not found.', 404);

    const activeCount = await Schedule.countDocuments({
      driver: req.params.id,
      status: { $in: [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.BOARDING, SCHEDULE_STATUS.IN_TRANSIT] },
    });

    if (activeCount > 0) {
      throw new AppError(
        `Cannot delete driver: they have ${activeCount} active schedule(s). Reassign them first.`,
        409
      );
    }

    await Driver.findByIdAndUpdate(req.params.id, { isDeleted: true, status: DRIVER_STATUS.INACTIVE });
    await User.findByIdAndUpdate(driver.user, { isActive: false });

    return sendSuccess(res, {}, 'Driver deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDrivers, getDriver, createDriver, updateDriver, deleteDriver };
