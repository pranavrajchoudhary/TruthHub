const mongoose = require("mongoose");

const factCheckSchema = new mongoose.Schema(
  {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerUsername: { type: String, required: true }, // Denormalized for faster queries
    
    // Verdict information
    verdict: { 
      type: String, 
      enum: ["true", "mostly-true", "mixed", "mostly-false", "false", "unsubstantiated"],
      required: true 
    },
    confidence: { type: Number, required: true, min: 1, max: 10 },
    
    // Evidence and reasoning
    evidence: { type: String, required: true, maxlength: 2000 },
    sources: [{ 
      type: String, 
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Source must be a valid URL'
      }
    }],
    
    // Expert information
    expertise: [{ type: String }], // ['Science', 'Health', 'Technology']
    
    // Community feedback
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    netVotes: { type: Number, default: 0 },
    
    // Status and flags
    status: { 
      type: String, 
      enum: ["active", "disputed", "endorsed", "flagged"],
      default: "active"
    },
    isExpertEndorsed: { type: Boolean, default: false },
    expertEndorsements: { type: Number, default: 0 },
    
    // Reviewer reputation at time of submission
    reviewerReputationAtTime: { type: Number, default: 0 },
    
    // Quality metrics
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    helpfulnessVotes: { type: Number, default: 0 },
    
    // Moderation
    isHidden: { type: Boolean, default: false },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderationReason: { type: String }
  },
  { timestamps: true }
);

// Index for efficient queries
factCheckSchema.index({ articleId: 1, createdAt: -1 });
factCheckSchema.index({ reviewer: 1, createdAt: -1 });
factCheckSchema.index({ verdict: 1, confidence: -1 });

// Pre-save middleware to calculate net votes
factCheckSchema.pre('save', function(next) {
  this.netVotes = this.upvotes - this.downvotes;
  next();
});

module.exports = mongoose.model("FactCheck", factCheckSchema);