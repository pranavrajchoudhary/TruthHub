const User = require('../models/User');
const Article = require('../models/Article');
const FactCheck = require('../models/FactCheck');
const Notification = require('../models/Notification');

// 🔹 Get leaderboard (top fact-checkers)
exports.getLeaderboard = async (req, res) => {
  try {
    const { 
      timeframe = 'all', 
      sortBy = 'reputation', 
      limit = 50,
      specialty 
    } = req.query;

    // Build time filter
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        dateFilter.lastActiveAt = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter.lastActiveAt = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'year':
        dateFilter.lastActiveAt = { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) };
        break;
      default:
        // All time - no date filter
        break;
    }

    // Build specialty filter
    const filter = { ...dateFilter };
    if (specialty && specialty !== 'all') {
      filter.specialties = { $in: [specialty] };
    }

    // Build sort
    const sort = {};
    switch (sortBy) {
      case 'reputation':
        sort.reputation = -1;
        break;
      case 'articlesVerified':
        sort.articlesVerified = -1;
        break;
      case 'accuracy':
        sort.accuracyRate = -1;
        break;
      default:
        sort.reputation = -1;
    }

    const users = await User.find(filter)
      .select('name username reputation articlesVerified accuracyRate badges level specialties joinDate lastActiveAt')
      .sort(sort)
      .limit(parseInt(limit));

    // Get additional stats for each user
    const leaderboard = await Promise.all(
      users.map(async (user, index) => {
        const [factCheckCount, recentActivity] = await Promise.all([
          FactCheck.countDocuments({ reviewer: user._id }),
          Article.countDocuments({ 
            submittedBy: user._id, 
            createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }
          })
        ]);

        return {
          rank: index + 1,
          ...user.toObject(),
          factCheckCount,
          recentActivity
        };
      })
    );

    res.json({
      leaderboard,
      timeframe,
      sortBy,
      totalUsers: users.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get community stats
exports.getCommunityStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalArticles,
      totalFactChecks,
      expertUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 
        lastActiveAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Article.countDocuments(),
      FactCheck.countDocuments(),
      User.countDocuments({ level: 'Expert' })
    ]);

    // Get growth stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      newUsers,
      newArticles,
      newFactChecks
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Article.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      FactCheck.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // Get accuracy statistics
    const accuracyStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgAccuracy: { $avg: '$accuracyRate' },
          avgReputation: { $avg: '$reputation' }
        }
      }
    ]);

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        totalArticles,
        totalFactChecks,
        expertUsers
      },
      growth: {
        newUsers,
        newArticles,
        newFactChecks
      },
      quality: {
        avgAccuracy: accuracyStats[0]?.avgAccuracy || 0,
        avgReputation: accuracyStats[0]?.avgReputation || 0
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get user activity feed
exports.getUserActivityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get recent articles and fact-checks
    const [recentArticles, recentFactChecks] = await Promise.all([
      Article.find()
        .populate('submittedBy', 'name username badges level')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit) / 2)
        .select('title sourceName category status credibilityScore createdAt'),
      
      FactCheck.find()
        .populate('reviewer', 'name username badges level')
        .populate('articleId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit) / 2)
        .select('verdict confidence reviewerUsername articleId createdAt')
    ]);

    // Combine and sort activities
    const activities = [];
    
    recentArticles.forEach(article => {
      activities.push({
        type: 'article_submitted',
        timestamp: article.createdAt,
        user: article.submittedBy,
        data: {
          title: article.title,
          sourceName: article.sourceName,
          category: article.category,
          status: article.status,
          credibilityScore: article.credibilityScore,
          articleId: article._id
        }
      });
    });

    recentFactChecks.forEach(factCheck => {
      activities.push({
        type: 'fact_check_submitted',
        timestamp: factCheck.createdAt,
        user: factCheck.reviewer,
        data: {
          verdict: factCheck.verdict,
          confidence: factCheck.confidence,
          articleTitle: factCheck.articleId?.title,
          articleId: factCheck.articleId?._id,
          factCheckId: factCheck._id
        }
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: activities.slice(0, parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get user badges and achievements
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .select('badges reputation articlesVerified accuracyRate level specialties joinDate');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate potential badges based on achievements
    const potentialBadges = [];
    
    if (user.articlesVerified >= 10 && !user.badges.includes('Fact-Checker')) {
      potentialBadges.push('Fact-Checker');
    }
    
    if (user.articlesVerified >= 50 && !user.badges.includes('Super Verifier')) {
      potentialBadges.push('Super Verifier');
    }
    
    if (user.reputation >= 1000 && !user.badges.includes('Trusted')) {
      potentialBadges.push('Trusted');
    }
    
    if (user.accuracyRate >= 90 && !user.badges.includes('Accurate')) {
      potentialBadges.push('Accurate');
    }

    // Award new badges
    if (potentialBadges.length > 0) {
      user.badges.push(...potentialBadges);
      await user.save();

      // Create notifications for new badges
      for (const badge of potentialBadges) {
        await Notification.createNotification({
          userId: user._id,
          type: 'badge_earned',
          title: 'New Badge Earned!',
          message: `Congratulations! You've earned the "${badge}" badge.`,
          actionable: false,
          icon: 'Award',
          color: 'purple',
          category: 'achievement'
        });
      }
    }

    res.json({
      currentBadges: user.badges,
      newBadges: potentialBadges,
      stats: {
        reputation: user.reputation,
        articlesVerified: user.articlesVerified,
        accuracyRate: user.accuracyRate,
        level: user.level
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update user level based on performance
exports.updateUserLevel = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let newLevel = user.level;
    
    // Level progression logic
    if (user.reputation >= 2000 && user.articlesVerified >= 100 && user.accuracyRate >= 95) {
      newLevel = 'Master';
    } else if (user.reputation >= 1000 && user.articlesVerified >= 50 && user.accuracyRate >= 90) {
      newLevel = 'Expert';
    } else if (user.reputation >= 500 && user.articlesVerified >= 20 && user.accuracyRate >= 80) {
      newLevel = 'Advanced';
    } else if (user.reputation >= 100 && user.articlesVerified >= 5 && user.accuracyRate >= 70) {
      newLevel = 'Novice';
    }

    if (newLevel !== user.level) {
      user.level = newLevel;
      await user.save();

      // Create notification for level up
      await Notification.createNotification({
        userId: user._id,
        type: 'reputation_milestone',
        title: 'Level Up!',
        message: `Congratulations! You've reached ${newLevel} level.`,
        actionable: false,
        icon: 'TrendingUp',
        color: 'green',
        category: 'achievement'
      });

      res.json({
        message: 'Level updated successfully',
        oldLevel: user.level,
        newLevel,
        user: {
          level: newLevel,
          reputation: user.reputation,
          articlesVerified: user.articlesVerified,
          accuracyRate: user.accuracyRate
        }
      });
    } else {
      res.json({
        message: 'No level change',
        currentLevel: user.level
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get trending topics/specialties
exports.getTrendingTopics = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Define time range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // Get trending categories from articles
    const trendingCategories = await Article.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' },
          totalViews: { $sum: '$viewCount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get trending tags
    const trendingTags = await Article.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$tags'
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          articles: { $addToSet: '$_id' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json({
      timeframe,
      trendingCategories,
      trendingTags
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};