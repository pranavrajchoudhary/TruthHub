const Article = require('../models/Article');
const User = require('../models/User');
const Source = require('../models/Source');
const FactCheck = require('../models/FactCheck');
const Notification = require('../models/Notification');
const { parseUrlContent } = require('../utils/parser');
const { checkAchievements } = require('../utils/achievements');

// 🔹 Submit new article
exports.submitArticle = async (req, res) => {
  try {
    const { url, title, subtitle, description, summary, category, sourceName, submissionType } = req.body;
    
    // Handle tags and sources arrays from FormData
    const tags = [];
    const sources = [];
    
    // Extract arrays from FormData format
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('tags[')) {
        tags.push(req.body[key]);
      } else if (key.startsWith('sources[')) {
        sources.push(req.body[key]);
      }
    });
    
    // Handle uploaded image files
    const uploadedImages = req.files || [];
    const imageUrls = uploadedImages.map(file => `/uploads/${file.filename}`);
    
    console.log('📥 Article submission received:', {
      submissionType,
      url: url ? 'PROVIDED' : 'EMPTY',
      title: title ? 'PROVIDED' : 'MISSING',
      description: description ? 'PROVIDED' : 'MISSING',
      category,
      tagsCount: tags.length,
      sourcesCount: sources.length,
      imagesCount: uploadedImages.length
    });
    
    // Use description as summary if summary is not provided
    const articleSummary = summary || description;

    let parsed = {};
    let domain = null;

    // Handle URL-based submissions
    if (submissionType === 'url' || (url && url.trim())) {
      // Validate URL
      if (!url || !url.trim()) {
        return res.status(400).json({ message: 'URL is required for URL-based submissions' });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid URL format' });
      }

      // Check if article with this URL already exists
      const existingArticle = await Article.findOne({ url });
      if (existingArticle) {
        return res.status(400).json({ message: 'Article with this URL already exists' });
      }

      // Auto-parse content from URL
      parsed = await parseUrlContent(url);
      
      // Extract domain from URL
      domain = new URL(url).hostname;
    } else {
      // Handle manual submissions
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Title is required for manual submissions' });
      }
      if (!articleSummary || !articleSummary.trim()) {
        return res.status(400).json({ message: 'Description is required for manual submissions' });
      }
    }
    
    // Find or create source (only for URL-based submissions)
    let source = null;
    if (domain) {
      source = await Source.findOne({ domain });
      if (!source && sourceName) {
        source = await Source.create({
          name: sourceName,
          domain,
          type: 'news-publication',
          reliabilityScore: 50, // Default
          totalArticles: 1
        });
      }
    }

    // Get user info for denormalization
    const user = await User.findById(req.user._id);

    // Calculate points earned based on submission quality
    const pointsEarned = 50; // Base points for article submission
    
    const article = await Article.create({
      url: url || null,
      title: title || parsed.title || 'Untitled',
      summary: articleSummary || parsed.summary || '',
      fullContent: parsed.fullContent || articleSummary || '',
      category: category || 'other',
      tags: tags?.length ? tags : parsed.tags || [],
      submittedBy: req.user._id,
      submittedByUsername: user.username,
      sourceName: sourceName || source?.name || domain || 'Manual Submission',
      sourceDomain: domain,
      sourceReliability: source?.trustLevel || 'unknown',
      author: Array.isArray(parsed.author) ? 
        (parsed.author.find(item => !item.startsWith('http')) || parsed.author[0] || '') : 
        String(parsed.author || '').trim(),
      publishedAt: parsed.publishedAt,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : parsed.image,
      thumbnailUrl: imageUrls.length > 0 ? imageUrls[0] : parsed.image,
      images: imageUrls // Store all uploaded image URLs
    });

    // Update user stats and reputation
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 
        articlesSubmitted: 1,
        reputation: pointsEarned,
        totalPoints: pointsEarned
      },
      lastActiveAt: new Date()
    });

    // Update source stats
    if (source) {
      await Source.findByIdAndUpdate(source._id, {
        $inc: { totalArticles: 1 }
      });
    }

    // Check for achievements
    const achievementResult = await checkAchievements(req.user._id);

    // Create notifications for all users except the author
    const Notification = require('../models/Notification');
    try {
      const allUsers = await User.find({ _id: { $ne: req.user._id } }, '_id');
      const notifications = allUsers.map(user => ({
        userId: user._id,
        type: 'new_article',
        title: 'New Article Published',
        message: `${req.user.username} published "${title}"`,
        actionUrl: `/article/${article._id}`,
        actionable: true,
        metadata: {
          articleId: article._id,
          authorId: req.user._id,
          category: category
        }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`📢 Created ${notifications.length} notifications for new article`);
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError);
      // Don't fail the article submission if notifications fail
    }

    // Populate the response
    const populatedArticle = await Article.findById(article._id)
      .populate('submittedBy', 'name username role reputation badges');

    res.status(201).json({
      message: 'Article submitted successfully',
      article: populatedArticle,
      pointsEarned,
      newAchievements: achievementResult.achievements,
      levelUp: achievementResult.levelUp
    });
  } catch (error) {
    console.error('❌ Article submission error:', error.message);
    console.error('Full error details:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit article',
      error: error.message
    });
  }
};

// 🔹 Get all articles with filtering and search
exports.getArticles = async (req, res) => {
  try {
    const {
      category,
      status,
      sourceReliability,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minCredibility,
      maxCredibility
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (sourceReliability && sourceReliability !== 'all') filter.sourceReliability = sourceReliability;
    
    if (minCredibility || maxCredibility) {
      filter.credibilityScore = {};
      if (minCredibility) filter.credibilityScore.$gte = parseInt(minCredibility);
      if (maxCredibility) filter.credibilityScore.$lte = parseInt(maxCredibility);
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { sourceName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('submittedBy', 'name username role reputation badges level')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Article.countDocuments(filter)
    ]);

    // If user is authenticated, get their votes for these articles
    let articlesWithVotes = articles;
    if (req.user) {
      const Vote = require('../models/Vote');
      const articleIds = articles.map(article => article._id);
      
      const userVotes = await Vote.find({
        userId: req.user._id,
        targetId: { $in: articleIds },
        targetType: 'article'
      });

      // Create a map of article ID to vote type for quick lookup
      const voteMap = {};
      userVotes.forEach(vote => {
        voteMap[vote.targetId.toString()] = vote.type;
      });

      // Add user vote info to each article
      articlesWithVotes = articles.map(article => {
        const articleObj = article.toObject();
        articleObj.userVote = voteMap[article._id.toString()] || null;
        return articleObj;
      });
    }

    res.json({
      articles: articlesWithVotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        category,
        status,
        sourceReliability,
        search
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get single article with fact-checks
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('submittedBy', 'name username role reputation badges level');
      
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Get fact-checks for this article
    const factChecks = await FactCheck.find({ articleId: req.params.id })
      .populate('reviewer', 'name username role reputation badges level')
      .sort({ netVotes: -1, createdAt: -1 });

    // Get user's vote if authenticated
    let articleWithVote = article.toObject();
    if (req.user) {
      const Vote = require('../models/Vote');
      const userVote = await Vote.findOne({
        userId: req.user._id,
        targetId: req.params.id,
        targetType: 'article'
      });
      articleWithVote.userVote = userVote ? userVote.type : null;
    }

    // Increment view count
    await Article.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 }
    });

    res.json({
      article: articleWithVote,
      factChecks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get ranked articles
exports.getRankedArticles = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Calculate date filter based on timeframe
    const now = new Date();
    let dateFilter = {};
    
    switch (timeframe) {
      case 'day':
        dateFilter.createdAt = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
        break;
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      default:
        // All time - no date filter
        break;
    }

    const articles = await Article.find(dateFilter)
      .populate('submittedBy', 'name username role reputation badges')
      .sort({ 
        credibilityScore: -1, 
        verifications: -1, 
        upvotes: -1, 
        viewCount: -1,
        createdAt: -1 
      })
      .limit(50);

    res.json({
      articles,
      timeframe
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ranked articles." });
  }
};

// 🔹 Vote on article
exports.voteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Don't allow voting on own articles
    if (article.submittedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot vote on your own article' });
    }

    const Vote = require('../models/Vote');
    
    // Check if user has already voted on this article
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      targetId: id,
      targetType: 'article'
    });

    let voteAction = 'added';
    let upvoteChange = 0;
    let downvoteChange = 0;
    let userVote = voteType;

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Same vote type - remove the vote (toggle off)
        await Vote.deleteOne({ _id: existingVote._id });
        voteAction = 'removed';
        userVote = null;
        
        // Decrement the count
        if (voteType === 'upvote') {
          upvoteChange = -1;
        } else {
          downvoteChange = -1;
        }
      } else {
        // Different vote type - switch the vote
        await Vote.findByIdAndUpdate(existingVote._id, { type: voteType });
        voteAction = 'switched';
        
        // Switch counts
        if (voteType === 'upvote') {
          upvoteChange = 1;
          downvoteChange = -1;
        } else {
          upvoteChange = -1;
          downvoteChange = 1;
        }
      }
    } else {
      // New vote
      await Vote.create({
        userId: req.user._id,
        targetId: id,
        targetType: 'article',
        type: voteType
      });
      
      // Increment the count
      if (voteType === 'upvote') {
        upvoteChange = 1;
      } else {
        downvoteChange = 1;
      }
    }

    // Update article vote counts
    const updatedArticle = await Article.findByIdAndUpdate(id, {
      $inc: { 
        upvotes: upvoteChange,
        downvotes: downvoteChange,
        totalVotes: upvoteChange + downvoteChange
      }
    }, { new: true });

    // Update user activity
    await User.findByIdAndUpdate(req.user._id, {
      lastActiveAt: new Date()
    });

    // Create notification for upvotes (not downvotes)
    if (voteType === 'upvote' && voteAction === 'added') {
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: article.submittedBy,
          type: 'article_upvoted',
          title: 'Article Upvoted',
          message: `${req.user.username} upvoted your article "${article.title}"`,
          actionUrl: `/article/${article._id}`,
          actionable: true,
          metadata: {
            articleId: article._id,
            voterId: req.user._id,
            voteType: 'upvote'
          }
        });
      } catch (notifError) {
        console.error('Failed to create upvote notification:', notifError);
        // Don't fail the vote if notification fails
      }
    }

    res.json({ 
      message: `Vote ${voteAction} successfully`,
      userVote: userVote,
      upvotes: updatedArticle.upvotes,
      downvotes: updatedArticle.downvotes,
      totalVotes: updatedArticle.totalVotes
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get trending articles
exports.getTrendingArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      isTrending: true
    })
    .populate('submittedBy', 'name username role reputation badges')
    .sort({ viewCount: -1, createdAt: -1 })
    .limit(20);

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const filter = category === 'all' ? {} : { category };
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('submittedBy', 'name username role reputation badges')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Article.countDocuments(filter)
    ]);

    res.json({
      articles,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get user's submitted articles
exports.getUserArticles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      Article.find({ submittedBy: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Article.countDocuments({ submittedBy: req.user._id })
    ]);

    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Analyze URL content (for form pre-filling)
exports.analyzeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Check if article with this URL already exists
    const existingArticle = await Article.findOne({ url });
    if (existingArticle) {
      return res.status(400).json({ 
        message: 'Article with this URL already exists',
        existing: true,
        article: existingArticle
      });
    }

    // Parse content from URL
    const parsed = await parseUrlContent(url);
    
    // Extract domain from URL
    const domain = new URL(url).hostname;
    
    // Find existing source for reliability info
    const source = await Source.findOne({ domain });

    // Suggest category based on content
    const suggestedCategory = suggestCategory(parsed.title, parsed.summary);

    // Return analysis results
    res.json({
      title: parsed.title || '',
      subtitle: parsed.subtitle || '',
      description: parsed.summary || '',
      author: Array.isArray(parsed.author) ? 
        (parsed.author.find(item => !item.startsWith('http')) || parsed.author[0] || '') : 
        String(parsed.author || '').trim(),
      publishDate: parsed.publishedAt || new Date().toISOString(),
      domain,
      sourceReliability: source?.trustLevel || 'unknown',
      reliabilityScore: source?.reliabilityScore || 0,
      language: parsed.language || 'en',
      suggestedCategory,
      extractedTags: parsed.tags || [],
      contentType: parsed.contentType || 'news',
      imageUrl: parsed.image || '',
      sourceExists: !!source,
      sourceName: source?.name || domain
    });
  } catch (error) {
    console.error('URL Analysis Error:', error);
    res.status(500).json({ message: 'Failed to analyze URL', error: error.message });
  }
};

// Helper function to suggest category based on content
const suggestCategory = (title = '', summary = '') => {
  const content = (title + ' ' + summary).toLowerCase();
  
  const categories = {
    'technology': ['tech', 'ai', 'artificial intelligence', 'software', 'computer', 'digital', 'internet', 'startup', 'innovation'],
    'science': ['research', 'study', 'scientific', 'discovery', 'experiment', 'climate', 'environment', 'health', 'medical'],
    'politics': ['government', 'election', 'policy', 'political', 'congress', 'senate', 'president', 'minister'],
    'business': ['economy', 'market', 'financial', 'company', 'business', 'economic', 'stock', 'investment'],
    'sports': ['sport', 'game', 'team', 'player', 'match', 'championship', 'olympic', 'football', 'basketball'],
    'entertainment': ['movie', 'music', 'celebrity', 'entertainment', 'film', 'actor', 'artist', 'show']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }

  return 'other';
};

// 🗑️ Delete article (author only)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        message: 'Article not found'
      });
    }
    
    // Check if the user is the author or has admin privileges
    if (article.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not authorized to delete this article'
      });
    }
    
    // Delete the article
    await Article.findByIdAndDelete(id);
    
    // Also delete associated fact-checks and notifications
    const FactCheck = require('../models/FactCheck');
    const Notification = require('../models/Notification');
    
    await FactCheck.deleteMany({ articleId: id });
    await Notification.deleteMany({ 'metadata.articleId': id });
    
    res.status(200).json({
      message: 'Article deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      message: 'Server error while deleting article',
      error: error.message
    });
  }
};
