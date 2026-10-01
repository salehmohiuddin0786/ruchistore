const { Notification, DeviceToken } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get user notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { user_id: req.user.id },
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  res.json({
    success: true,
    data: { notifications },
  });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({
    where: { id, user_id: req.user.id },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404, "NOT_FOUND");
  }

  await notification.update({ read: true });

  res.json({
    success: true,
    message: "Notification marked as read",
  });
});

// Register FCM Device Token
const registerDeviceToken = asyncHandler(async (req, res) => {
  const { token, platform = "WEB" } = req.body;
  if (!token) throw new AppError("Token is required", 400, "MISSING_TOKEN");

  await DeviceToken.findOrCreate({
    where: { user_id: req.user.id, token },
    defaults: { user_id: req.user.id, token, platform },
  });

  res.json({
    success: true,
    message: "Device token registered successfully",
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  registerDeviceToken,
};
