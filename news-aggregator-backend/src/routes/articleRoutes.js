const express = require('express');
const {
  submitArticle,
  getArticles,
  getArticleById,
  voteArticle,
  deleteArticle,
  getRankedArticles,
  getTrendingArticles,
  getArticlesByCategory,
  getUserArticles,
  analyzeUrl
} = require('../controllers/articleController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadImages } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getArticles); // Get all articles with filtering
router.get('/ranked', getRankedArticles); // Get ranked articles
router.get('/trending', getTrendingArticles); // Get trending articles
router.get('/category/:category', getArticlesByCategory); // Get articles by category
router.get('/:id', getArticleById); // Get single article by ID

// Protected routes
router.post('/', protect, uploadImages, submitArticle); // Submit new article with file uploads
router.post('/analyze-url', protect, analyzeUrl); // Analyze URL content
router.post('/:id/vote', protect, voteArticle); // Vote on article
router.delete('/:id', protect, deleteArticle); // Delete article (author only)
router.get('/user/my-articles', protect, getUserArticles); // Get user's articles

module.exports = router;
