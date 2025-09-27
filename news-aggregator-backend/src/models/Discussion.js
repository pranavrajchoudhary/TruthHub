const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  parentReply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }, // For nested replies
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Discussion can be about an article or standalone
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  category: { 
    type: String, 
    enum: ['general', 'politics', 'technology', 'science', 'health', 'business', 'sports', 'entertainment', 'world'], 
    default: 'general' 
  },
  
  // Thread stats
  replies: [replySchema],
  replyCount: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  
  // Moderation
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  
  // Engagement
  viewCount: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  
  // Tags for better discovery
  tags: [{ type: String, maxlength: 30 }]
}, { timestamps: true });

// Indexes for performance
discussionSchema.index({ articleId: 1 });
discussionSchema.index({ category: 1, lastActivity: -1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ totalVotes: -1 });
discussionSchema.index({ isPinned: -1, lastActivity: -1 });

// Update lastActivity when replies are added
discussionSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.lastActivity = new Date();
    this.replyCount = this.replies.filter(reply => !reply.isDeleted).length;
  }
  next();
});

module.exports = mongoose.model('Discussion', discussionSchema);