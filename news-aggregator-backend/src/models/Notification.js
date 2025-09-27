const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: [
        "article_verified", 
        "fact_check_disputed", 
        "reputation_milestone", 
        "new_discussion", 
        "trending_article", 
        "expert_endorsement",
        "community_activity",
        "badge_earned",
        "article_featured",
        "fact_check_endorsed",
        "mention",
        "system_update"
      ],
      required: true 
    },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, required: true, maxlength: 500 },
    
    // Related entities
    relatedArticle: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    relatedFactCheck: { type: mongoose.Schema.Types.ObjectId, ref: "FactCheck" },
    relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // Action information
    actionable: { type: Boolean, default: false },
    actionUrl: { type: String }, // Frontend route for action
    actionText: { type: String }, // "View Article", "Join Discussion", etc.
    
    // Status
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    
    // Priority and categorization
    priority: { 
      type: String, 
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    category: {
      type: String,
      enum: ["verification", "community", "achievement", "moderation", "system"],
      default: "verification"
    },
    
    // Visual styling hints for frontend
    icon: { type: String }, // Icon name for frontend
    color: { 
      type: String, 
      enum: ["blue", "green", "yellow", "red", "purple", "gray"],
      default: "blue"
    },
    
    // Expiration and cleanup
    expiresAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    
    // Metadata for tracking
    sourceAction: { type: String }, // What triggered this notification
    metadata: { type: mongoose.Schema.Types.Mixed } // Additional data as needed
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Here you could add real-time notification logic (WebSocket, etc.)
  // io.to(data.userId).emit('new-notification', notification);
  
  return notification;
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCountForUser = async function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

module.exports = mongoose.model("Notification", notificationSchema);