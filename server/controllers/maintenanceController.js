/**
 * maintenanceController.js
 */

const MaintenanceRecord = require('../models/MaintenanceRecord');
const Vehicle = require('../models/Vehicle');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { MAINTENANCE_STATUS, VEHICLE_STATUS } = require('../config/constants');

// GET /api/maintenance
const getMaintenanceRecords = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, vehicle, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (type) filter.type = type;

    const [records, total] = await Promise.all([
      MaintenanceRecord.find(filter)
        .populate('vehicle', 'vehicleCode plateNumber model manufacturer')
        .populate('createdBy', 'firstName lastName')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit),
      MaintenanceRecord.countDocuments(filter),
    ]);

    return sendPaginated(res, records, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/maintenance/:id
const getMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id)
      .populate('vehicle', 'vehicleCode plateNumber model')
      .populate('createdBy', 'firstName lastName email');
    if (!record) throw new AppError('Maintenance record not found.', 404);
    return sendSuccess(res, { data: record });
  } catch (err) {
    next(err);
  }
};

// POST /api/maintenance
const createMaintenanceRecord = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) throw new AppError('Vehicle not found.', 404);

    const record = await MaintenanceRecord.create({
      ...req.body,
      createdBy: req.user._id,
    });

    // If blocksVehicle is true, update vehicle status to maintenance
    if (record.blocksVehicle) {
      await Vehicle.findByIdAndUpdate(req.body.vehicle, { status: VEHICLE_STATUS.MAINTENANCE });
    }

    const populated = await MaintenanceRecord.findById(record._id)
      .populate('vehicle', 'vehicleCode plateNumber')
      .populate('createdBy', 'firstName lastName');

    return sendSuccess(res, { data: populated }, 'Maintenance record created.', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/maintenance/:id
const updateMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('vehicle', 'vehicleCode plateNumber')
      .populate('createdBy', 'firstName lastName');

    if (!record) throw new AppError('Maintenance record not found.', 404);

    // If completed, restore vehicle to active (if it was blocked)
    if (req.body.status === MAINTENANCE_STATUS.COMPLETED && record.blocksVehicle) {
      await Vehicle.findByIdAndUpdate(record.vehicle._id, { status: VEHICLE_STATUS.ACTIVE });
    }

    return sendSuccess(res, { data: record }, 'Maintenance record updated.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/maintenance/:id
const deleteMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
    if (!record) throw new AppError('Maintenance record not found.', 404);
    return sendSuccess(res, {}, 'Maintenance record deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
};
