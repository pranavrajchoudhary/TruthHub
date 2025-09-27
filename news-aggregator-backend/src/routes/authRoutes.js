const express = require("express");
const { 
  register, 
  login, 
  getProfile, 
  updateProfile,
  getUserStats,
  getPlatformStats,
  getPublicProfile,
  getLeaderboard,
  getUserAchievements,
  adminOnly 
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/user/:username", getPublicProfile); // Public profile by username
router.get("/platform-stats", getPlatformStats); // Platform statistics
router.get("/leaderboard", getLeaderboard); // User leaderboard

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/stats", protect, getUserStats);
router.get("/achievements", protect, getUserAchievements);

// Example protected route (admin only)
router.get("/admin", protect, authorize("admin"), adminOnly);

module.exports = router;
