const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    reputation: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }, // Total points earned across all activities
    articlesVerified: { type: Number, default: 0 },
    articlesSubmitted: { type: Number, default: 0 },
    accuracyRate: { type: Number, default: 0 }, // Percentage
    badges: [{ type: String }], // ['Expert', 'Trusted', 'Top Contributor']
    level: { 
      type: String, 
      enum: ['Novice', 'Advanced', 'Expert', 'Master'],
      default: 'Novice'
    },
    specialties: [{ type: String }], // ['Science', 'Politics', 'Technology']
    joinDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    totalVotes: { type: Number, default: 0 },
    correctPredictions: { type: Number, default: 0 },
    bio: { type: String, maxlength: 500 },
    website: { type: String },
    location: { type: String }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to calculate user level based on reputation
userSchema.methods.calculateLevel = function() {
  const reputation = this.reputation || 0;
  
  if (reputation >= 1000) return 'Master';
  else if (reputation >= 500) return 'Expert';
  else if (reputation >= 100) return 'Advanced';
  else return 'Novice';
};

// Pre-save hook to update level
userSchema.pre('save', function(next) {
  const oldLevel = this.level;
  this.level = this.calculateLevel();
  
  // Store if level changed for middleware access
  this._levelChanged = oldLevel !== this.level;
  this._oldLevel = oldLevel;
  
  next();
});

module.exports = mongoose.model("User", userSchema);
