import Notification from '../models/Notification.js';

/**
 * GET /api/tutor/notifications
 * Returns notifications for the authenticated user (tutor). No need to be online.
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { userId };
    if (unreadOnly) query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tutor/notifications/:id/read
 * Mark a notification as read.
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(notification);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tutor/notifications/read-all
 * Mark all notifications for the user as read.
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    return res.json({ updated: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};
