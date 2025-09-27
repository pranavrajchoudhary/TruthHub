const express = require('express');
const {
  submitFactCheck,
  getFactChecksForArticle,
  voteOnFactCheck,
  getUserFactChecks,
  getFactCheckById,
  updateFactCheck,
  getTrendingFactChecks
} = require('../controllers/factCheckController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/article/:articleId', getFactChecksForArticle); // Get fact-checks for article
router.get('/trending', getTrendingFactChecks); // Get trending fact-checks
router.get('/:factCheckId', getFactCheckById); // Get fact-check by ID

// Protected routes
router.post('/article/:articleId', protect, submitFactCheck); // Submit fact-check
router.post('/:factCheckId/vote', protect, voteOnFactCheck); // Vote on fact-check
router.put('/:factCheckId', protect, updateFactCheck); // Update fact-check
router.get('/user/my-factchecks', protect, getUserFactChecks); // Get user's fact-checks

module.exports = router;