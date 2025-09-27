const express = require('express');
const {
  getSources,
  getSourceByDomain,
  getSourceAnalytics,
  getTopSources,
  updateSourceReliability,
  createOrUpdateSource,
  compareSourcesReliability
} = require('../controllers/sourceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getSources); // Get sources with filtering
router.get('/top', getTopSources); // Get top sources by reliability
router.get('/compare', compareSourcesReliability); // Compare sources
router.get('/:domain', getSourceByDomain); // Get source by domain
router.get('/:domain/analytics', getSourceAnalytics); // Get source analytics

// Protected routes (admin/moderator)
router.put('/:domain', protect, authorize(['admin', 'moderator']), createOrUpdateSource); // Create/update source
router.post('/:domain/update-reliability', protect, authorize(['admin', 'moderator']), updateSourceReliability); // Update reliability

module.exports = router;