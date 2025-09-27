const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    domain: { type: String, required: true, unique: true },
    type: { 
      type: String, 
      enum: ["academic-journal", "news-publication", "government", "blog", "social-media", "nonprofit", "other"],
      required: true 
    },
    
    // Reliability metrics
    reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
    trustLevel: { 
      type: String, 
      enum: ["very-high", "high", "medium", "low", "very-low"],
      default: "medium"
    },
    
    // Historical data
    established: { type: String }, // Year established
    totalArticles: { type: Number, default: 0 },
    verifiedArticles: { type: Number, default: 0 },
    disputedArticles: { type: Number, default: 0 },
    
    // Expert endorsements
    expertEndorsements: { type: Number, default: 0 },
    peerReviewProcess: { type: Boolean, default: false },
    impactFactor: { type: Number }, // For academic journals
    
    // Specialties and coverage
    specialties: [{ type: String }], // ['Science', 'Politics', 'Technology']
    coverageAreas: [{ type: String }], // Geographic or topic areas
    
    // Accuracy metrics
    recentAccuracy: { type: Number, default: 0, min: 0, max: 100 }, // Last 30 days
    overallAccuracy: { type: Number, default: 0, min: 0, max: 100 },
    biasRating: { 
      type: String, 
      enum: ["far-left", "left", "center-left", "center", "center-right", "right", "far-right", "mixed"],
      default: "mixed"
    },
    
    // Transparency and correction policy
    transparencyScore: { type: Number, default: 5, min: 0, max: 10 },
    correctionPolicy: { 
      type: String, 
      enum: ["excellent", "good", "fair", "poor", "none"],
      default: "fair"
    },
    
    // Contact and verification
    contactInfo: {
      email: { type: String },
      phone: { type: String },
      address: { type: String }
    },
    
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    
    // Performance trends (arrays for charting)
    trends: {
      reliability: [{ type: Number }], // Last 12 months
      volume: [{ type: Number }], // Article volume last 12 months
      accuracy: [{ type: Number }] // Accuracy last 12 months
    },
    
    // Metadata
    description: { type: String, maxlength: 1000 },
    logo: { type: String }, // URL to logo
    website: { type: String },
    
    // Flags
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
    isFeatured: { type: Boolean, default: false },
    
    // Analytics
    totalViews: { type: Number, default: 0 },
    monthlyViews: { type: Number, default: 0 },
    lastAnalyzed: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes for efficient queries
sourceSchema.index({ domain: 1 });
sourceSchema.index({ reliabilityScore: -1 });
sourceSchema.index({ type: 1, reliabilityScore: -1 });
sourceSchema.index({ specialties: 1 });

// Virtual for accuracy percentage
sourceSchema.virtual('accuracyPercentage').get(function() {
  if (this.totalArticles === 0) return 0;
  return Math.round((this.verifiedArticles / this.totalArticles) * 100);
});

// Method to update reliability score based on recent performance
sourceSchema.methods.updateReliabilityScore = function() {
  const accuracyWeight = 0.4;
  const volumeWeight = 0.2;
  const endorsementWeight = 0.2;
  const transparencyWeight = 0.2;
  
  const accuracyScore = this.recentAccuracy;
  const volumeScore = Math.min(this.totalArticles / 100, 1) * 100; // Normalize volume
  const endorsementScore = Math.min(this.expertEndorsements / 10, 1) * 100;
  const transparencyScore = this.transparencyScore * 10;
  
  this.reliabilityScore = Math.round(
    (accuracyScore * accuracyWeight) +
    (volumeScore * volumeWeight) +
    (endorsementScore * endorsementWeight) +
    (transparencyScore * transparencyWeight)
  );
  
  // Update trust level based on reliability score
  if (this.reliabilityScore >= 90) this.trustLevel = "very-high";
  else if (this.reliabilityScore >= 75) this.trustLevel = "high";
  else if (this.reliabilityScore >= 50) this.trustLevel = "medium";
  else if (this.reliabilityScore >= 25) this.trustLevel = "low";
  else this.trustLevel = "very-low";
};

module.exports = mongoose.model("Source", sourceSchema);