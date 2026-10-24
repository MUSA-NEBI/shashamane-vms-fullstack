/**
 * scheduleTemplateController.js
 * CRUD for recurring schedule templates.
 */

const ScheduleTemplate = require('../models/ScheduleTemplate');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// GET /api/schedules/templates
const getTemplates = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

    const [templates, total] = await Promise.all([
      ScheduleTemplate.find(filter)
        .populate('route', 'routeName origin destination')
        .populate('vehicle', 'vehicleCode manufacturer model')
        .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ScheduleTemplate.countDocuments(filter),
    ]);

    return sendPaginated(res, templates, buildPaginationMeta(total, page, limit));
  } catch (err) { next(err); }
};

// GET /api/schedules/templates/:id
const getTemplate = async (req, res, next) => {
  try {
    const template = await ScheduleTemplate.findById(req.params.id)
      .populate('route', 'routeName origin destination estimatedDuration baseFare')
      .populate('vehicle', 'vehicleCode manufacturer model capacity')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } });
    if (!template) throw new AppError('Template not found.', 404);
    return sendSuccess(res, { data: template });
  } catch (err) { next(err); }
};

// POST /api/schedules/templates
const createTemplate = async (req, res, next) => {
  try {
    if (new Date(req.body.validUntil) <= new Date(req.body.validFrom)) {
      throw new AppError('validUntil must be after validFrom.', 400);
    }
    const template = await ScheduleTemplate.create(req.body);
    const populated = await ScheduleTemplate.findById(template._id)
      .populate('route', 'routeName origin destination')
      .populate('vehicle', 'vehicleCode manufacturer model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } });
    return sendSuccess(res, { data: populated }, 'Template created.', 201);
  } catch (err) { next(err); }
};

// PATCH /api/schedules/templates/:id
const updateTemplate = async (req, res, next) => {
  try {
    const template = await ScheduleTemplate.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    )
      .populate('route', 'routeName origin destination')
      .populate('vehicle', 'vehicleCode manufacturer model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } });
    if (!template) throw new AppError('Template not found.', 404);
    return sendSuccess(res, { data: template }, 'Template updated.');
  } catch (err) { next(err); }
};

// DELETE /api/schedules/templates/:id
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await ScheduleTemplate.findByIdAndDelete(req.params.id);
    if (!template) throw new AppError('Template not found.', 404);
    return sendSuccess(res, {}, 'Template deleted.');
  } catch (err) { next(err); }
};

module.exports = { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
