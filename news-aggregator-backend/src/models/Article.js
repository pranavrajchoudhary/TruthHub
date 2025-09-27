const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: false }, // Made optional to support manual submissions
    summary: { type: String },
    fullContent: { type: String },
    category: { 
      type: String, 
      enum: ["politics", "tech", "technology", "health", "sports", "environment", "science", "social", "economy", "education", "other"], 
      default: "other" 
    },
    tags: [String],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submittedByUsername: { type: String }, // Denormalized for faster queries
    status: { 
      type: String, 
      enum: ["pending", "verified", "disputed", "under-review"], 
      default: "pending" 
    },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    
    // Source information
    sourceName: { type: String },
    sourceReliability: { 
      type: String, 
      enum: ["high", "medium", "low", "unknown"], 
      default: "unknown" 
    },
    sourceDomain: { type: String },
    
    // Credibility scoring
    credibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    verifications: { type: Number, default: 0 },
    disputes: { type: Number, default: 0 },
    totalVotes: { type: Number, default: 0 },
    
    // Publication info
    publishedAt: { type: Date },
    author: { type: String },
    
    // Fact-checking status
    factCheckCount: { type: Number, default: 0 },
    consensusVerdict: { 
      type: String, 
      enum: ["true", "mostly-true", "mixed", "mostly-false", "false", "unsubstantiated", "pending"],
      default: "pending"
    },
    
    // Engagement metrics
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    discussionCount: { type: Number, default: 0 },
    
    // Image and media
    imageUrl: { type: String },
    thumbnailUrl: { type: String },
    images: [{ type: String }], // Array of uploaded image URLs
    
    // Points and rewards
    pointsEarned: { type: Number, default: 50 }, // Points earned by submitter
    qualityScore: { type: Number, default: 0, min: 0, max: 100 }, // Overall quality assessment
    
    // Flags
    isTrending: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
