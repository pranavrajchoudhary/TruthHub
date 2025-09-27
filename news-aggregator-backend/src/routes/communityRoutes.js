const express = require('express');
const {
  getLeaderboard,
  getCommunityStats,
  getUserActivityFeed,
  getUserBadges,
  updateUserLevel,
  getTrendingTopics
} = require('../controllers/communityController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/leaderboard', getLeaderboard); // Get community leaderboard
router.get('/stats', getCommunityStats); // Get community statistics
router.get('/activity', getUserActivityFeed); // Get activity feed
router.get('/trending', getTrendingTopics); // Get trending topics

// Protected routes
router.get('/badges', protect, getUserBadges); // Get user badges
router.post('/level-up', protect, updateUserLevel); // Update user level

module.exports = router;