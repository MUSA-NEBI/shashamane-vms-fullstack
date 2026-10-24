/**
 * vehicleController.js
 */

const Vehicle = require('../models/Vehicle');
const Schedule = require('../models/Schedule');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { VEHICLE_STATUS, SCHEDULE_STATUS, MAINTENANCE_STATUS } = require('../config/constants');

// GET /api/vehicles
const getVehicles = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, search, fuelType } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (fuelType) filter.fuelType = fuelType;
    if (search) {
      filter.$or = [
        { vehicleCode: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    return sendPaginated(res, vehicles, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/:id
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new AppError('Vehicle not found.', 404);
    return sendSuccess(res, { data: vehicle });
  } catch (err) {
    next(err);
  }
};

// POST /api/vehicles
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    return sendSuccess(res, { data: vehicle }, 'Vehicle created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/vehicles/:id
const updateVehicle = async (req, res, next) => {
  try {
    // Prevent vehicleCode change (it's a stable identifier)
    delete req.body.vehicleCode;

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) throw new AppError('Vehicle not found.', 404);
    return sendSuccess(res, { data: vehicle }, 'Vehicle updated successfully.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/vehicles/:id  — soft delete, blocked if active schedules exist
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new AppError('Vehicle not found.', 404);

    // Check for future/active schedules
    const activeScheduleCount = await Schedule.countDocuments({
      vehicle: req.params.id,
      status: { $in: [SCHEDULE_STATUS.SCHEDULED, SCHEDULE_STATUS.BOARDING, SCHEDULE_STATUS.IN_TRANSIT] },
    });

    if (activeScheduleCount > 0) {
      throw new AppError(
        `Cannot delete vehicle: it has ${activeScheduleCount} active schedule(s). Deactivate or reassign them first.`,
        409
      );
    }

    await Vehicle.findByIdAndUpdate(req.params.id, { isDeleted: true, status: VEHICLE_STATUS.INACTIVE });
    return sendSuccess(res, {}, 'Vehicle deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

// GET /api/vehicles/:id/maintenance
const getVehicleMaintenance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [records, total] = await Promise.all([
      MaintenanceRecord.find({ vehicle: req.params.id })
        .populate('createdBy', 'firstName lastName')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit),
      MaintenanceRecord.countDocuments({ vehicle: req.params.id }),
    ]);
    return sendPaginated(res, records, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle, getVehicleMaintenance };
