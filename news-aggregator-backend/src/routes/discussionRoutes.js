const express = require('express');
const {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  addReply,
  voteDiscussion,
  deleteDiscussion,
  deleteReply,
  editReply
} = require('../controllers/discussionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getDiscussions); // Get all discussions with filtering
router.get('/:id', getDiscussionById); // Get single discussion with replies

// Protected routes
router.post('/', protect, createDiscussion); // Create new discussion
router.post('/:id/replies', protect, addReply); // Add reply to discussion
router.post('/:id/vote', protect, voteDiscussion); // Vote on discussion or reply
router.delete('/:id', protect, deleteDiscussion); // Delete discussion (author only)
router.delete('/:id/replies/:replyId', protect, deleteReply); // Delete reply (author only)
router.put('/:id/replies/:replyId', protect, editReply); // Edit reply (author only)

module.exports = router;