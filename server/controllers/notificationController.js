/**
 * notificationController.js
 */

const Notification = require('../models/Notification');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// GET /api/notifications  — current user's notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { unreadOnly } = req.query;

    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    return sendPaginated(res, notifications, { ...buildPaginationMeta(total, page, limit), unreadCount });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found.', 404);
    return sendSuccess(res, { data: notification }, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    return sendSuccess(res, {}, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
