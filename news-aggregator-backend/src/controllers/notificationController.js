const Notification = require('../models/Notification');

// 🔹 Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type,
      category 
    } = req.query;

    // Build filter
    const filter = { userId: req.user._id };
    
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('relatedUser', 'name username')
        .populate('relatedArticle', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      
      Notification.countDocuments(filter),
      
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    // Add time ago virtual
    const notificationsWithTimeAgo = notifications.map(notification => ({
      ...notification.toObject(),
      timeAgo: notification.timeAgo
    }));

    res.json({
      notifications: notificationsWithTimeAgo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        userId: req.user._id 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsReadForUser(req.user._id);
    
    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get notification settings/preferences
exports.getNotificationSettings = async (req, res) => {
  try {
    // In a real app, you'd have a NotificationSettings model
    // For now, return default settings
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      types: {
        article_verified: true,
        fact_check_disputed: true,
        reputation_milestone: true,
        new_discussion: false,
        trending_article: false,
        expert_endorsement: true,
        community_activity: false,
        badge_earned: true,
        article_featured: true,
        fact_check_endorsed: true,
        mention: true,
        system_update: true
      },
      frequency: 'instant' // instant, daily, weekly
    };

    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, types, frequency } = req.body;
    
    // In a real app, you'd save these to a NotificationSettings model
    // For now, just return success
    
    res.json({
      message: 'Notification settings updated successfully',
      settings: {
        emailNotifications,
        pushNotifications,
        types,
        frequency
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Create notification (admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      relatedArticle,
      relatedFactCheck,
      relatedUser,
      actionable,
      actionUrl,
      actionText,
      priority,
      category,
      icon,
      color,
      expiresAt
    } = req.body;

    const notification = await Notification.createNotification({
      userId,
      type,
      title,
      message,
      relatedArticle,
      relatedFactCheck,
      relatedUser,
      actionable,
      actionUrl,
      actionText,
      priority,
      category,
      icon,
      color,
      expiresAt
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [
      totalNotifications,
      unreadNotifications,
      typeBreakdown,
      recentActivity
    ] = await Promise.all([
      Notification.countDocuments({ userId }),
      
      Notification.countDocuments({ userId, isRead: false }),
      
      Notification.aggregate([
        { $match: { userId } },
        { 
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      Notification.countDocuments({
        userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      typeBreakdown,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Archive old notifications
exports.archiveOldNotifications = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        createdAt: { $lt: cutoffDate },
        isRead: true
      },
      {
        isArchived: true
      }
    );

    res.json({
      message: 'Old notifications archived successfully',
      archivedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};