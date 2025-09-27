const express = require('express');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification,
  getNotificationStats,
  archiveOldNotifications
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Protected routes (user must be authenticated)
router.get('/', protect, getUserNotifications); // Get user notifications
router.get('/stats', protect, getNotificationStats); // Get notification statistics
router.get('/settings', protect, getNotificationSettings); // Get notification settings
router.put('/settings', protect, updateNotificationSettings); // Update notification settings
router.put('/mark-all-read', protect, markAllNotificationsAsRead); // Mark all as read
router.put('/archive-old', protect, archiveOldNotifications); // Archive old notifications
router.put('/:notificationId/read', protect, markNotificationAsRead); // Mark specific as read
router.delete('/:notificationId', protect, deleteNotification); // Delete notification

// Admin routes
router.post('/', protect, authorize(['admin', 'moderator']), createNotification); // Create notification

module.exports = router;