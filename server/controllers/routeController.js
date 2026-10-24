/**
 * routeController.js
 */

const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// GET /api/routes
const getRoutes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, origin, destination, isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (origin) filter.origin = { $regex: origin, $options: 'i' };
    if (destination) filter.destination = { $regex: destination, $options: 'i' };
    if (search) {
      filter.$or = [
        { routeName: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    const [routes, total] = await Promise.all([
      Route.find(filter).sort({ routeName: 1 }).skip(skip).limit(limit),
      Route.countDocuments(filter),
    ]);

    return sendPaginated(res, routes, buildPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

// GET /api/routes/:id
const getRoute = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) throw new AppError('Route not found.', 404);
    return sendSuccess(res, { data: route });
  } catch (err) {
    next(err);
  }
};

// POST /api/routes
const createRoute = async (req, res, next) => {
  try {
    const route = await Route.create(req.body);
    return sendSuccess(res, { data: route }, 'Route created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/routes/:id
const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!route) throw new AppError('Route not found.', 404);
    return sendSuccess(res, { data: route }, 'Route updated successfully.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/routes/:id
const deleteRoute = async (req, res, next) => {
  try {
    const scheduleCount = await Schedule.countDocuments({ route: req.params.id });
    if (scheduleCount > 0) {
      throw new AppError(`Cannot delete route: it is used by ${scheduleCount} schedule(s).`, 409);
    }
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) throw new AppError('Route not found.', 404);
    return sendSuccess(res, {}, 'Route deleted successfully.');
  } catch (err) {
    next(err);
  }
};

// GET /api/routes/origins  — distinct origins for trip search dropdowns
const getOrigins = async (req, res, next) => {
  try {
    const origins = await Route.distinct('origin', { isActive: true });
    return sendSuccess(res, { data: origins.sort() });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoutes, getRoute, createRoute, updateRoute, deleteRoute, getOrigins };
