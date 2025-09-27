const Source = require('../models/Source');
const Article = require('../models/Article');
const FactCheck = require('../models/FactCheck');

// 🔹 Get all sources with filtering
exports.getSources = async (req, res) => {
  try {
    const {
      type,
      trustLevel,
      search,
      sortBy = 'reliabilityScore',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (trustLevel && trustLevel !== 'all') filter.trustLevel = trustLevel;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { specialties: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const [sources, total] = await Promise.all([
      Source.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Source.countDocuments(filter)
    ]);

    res.json({
      sources,
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

// 🔹 Get source by domain
exports.getSourceByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    
    const source = await Source.findOne({ domain });
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    // Get recent articles from this source
    const recentArticles = await Article.find({ sourceDomain: domain })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status credibilityScore createdAt verifications disputes');

    // Calculate recent performance metrics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentStats = await Article.aggregate([
      {
        $match: {
          sourceDomain: domain,
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: null,
          totalArticles: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          disputedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      source,
      recentArticles,
      recentStats: recentStats[0] || {
        totalArticles: 0,
        avgCredibility: 0,
        verifiedCount: 0,
        disputedCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get source analytics
exports.getSourceAnalytics = async (req, res) => {
  try {
    const { domain } = req.params;
    const { timeframe = '6months' } = req.query;

    const source = await Source.findOne({ domain });
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    // Define time range
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '1month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 6));
    }

    // Monthly breakdown
    const monthlyStats = await Article.aggregate([
      {
        $match: {
          sourceDomain: domain,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          articleCount: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          disputedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Category breakdown
    const categoryStats = await Article.aggregate([
      {
        $match: {
          sourceDomain: domain,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Fact-check distribution
    const factCheckStats = await Article.aggregate([
      {
        $match: {
          sourceDomain: domain,
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'factchecks',
          localField: '_id',
          foreignField: 'articleId',
          as: 'factChecks'
        }
      },
      {
        $unwind: { 
          path: '$factChecks',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$factChecks.verdict',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      source,
      timeframe,
      monthlyStats,
      categoryStats,
      factCheckStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get top sources by reliability
exports.getTopSources = async (req, res) => {
  try {
    const { limit = 20, type } = req.query;
    
    const filter = type && type !== 'all' ? { type } : {};
    
    const sources = await Source.find(filter)
      .sort({ reliabilityScore: -1, totalArticles: -1 })
      .limit(parseInt(limit))
      .select('name domain type reliabilityScore trustLevel totalArticles verifiedArticles specialties');

    res.json(sources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update source reliability score (admin/system)
exports.updateSourceReliability = async (req, res) => {
  try {
    const { domain } = req.params;
    
    const source = await Source.findOne({ domain });
    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    // Recalculate based on recent article performance
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentStats = await Article.aggregate([
      {
        $match: {
          sourceDomain: domain,
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: null,
          totalArticles: { $sum: 1 },
          avgCredibility: { $avg: '$credibilityScore' },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          totalFactChecks: { $sum: '$factCheckCount' }
        }
      }
    ]);

    if (recentStats.length > 0) {
      const stats = recentStats[0];
      const accuracyRate = stats.totalArticles > 0 ? 
        (stats.verifiedCount / stats.totalArticles) * 100 : 50;
      
      source.recentAccuracy = Math.round(accuracyRate);
      source.updateReliabilityScore();
      source.lastAnalyzed = new Date();
      
      // Update trends
      if (!source.trends.reliability) source.trends.reliability = [];
      if (!source.trends.accuracy) source.trends.accuracy = [];
      if (!source.trends.volume) source.trends.volume = [];
      
      source.trends.reliability.push(source.reliabilityScore);
      source.trends.accuracy.push(source.recentAccuracy);
      source.trends.volume.push(stats.totalArticles);
      
      // Keep only last 12 months
      if (source.trends.reliability.length > 12) {
        source.trends.reliability = source.trends.reliability.slice(-12);
        source.trends.accuracy = source.trends.accuracy.slice(-12);
        source.trends.volume = source.trends.volume.slice(-12);
      }
      
      await source.save();
    }

    res.json({
      message: 'Source reliability updated successfully',
      source
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Create or update source
exports.createOrUpdateSource = async (req, res) => {
  try {
    const {
      name,
      domain,
      type,
      established,
      specialties,
      description,
      contactInfo
    } = req.body;

    let source = await Source.findOne({ domain });
    
    if (source) {
      // Update existing source
      source = await Source.findOneAndUpdate(
        { domain },
        {
          name: name || source.name,
          type: type || source.type,
          established: established || source.established,
          specialties: specialties || source.specialties,
          description: description || source.description,
          contactInfo: contactInfo || source.contactInfo
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new source
      source = await Source.create({
        name,
        domain,
        type,
        established,
        specialties: specialties || [],
        description,
        contactInfo
      });
    }

    res.status(source.isNew ? 201 : 200).json({
      message: source.isNew ? 'Source created successfully' : 'Source updated successfully',
      source
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Get source comparison
exports.compareSourcesReliability = async (req, res) => {
  try {
    const { domains } = req.query; // Comma-separated list
    
    if (!domains) {
      return res.status(400).json({ message: 'Domains parameter is required' });
    }

    const domainList = domains.split(',').map(d => d.trim());
    
    const sources = await Source.find({ 
      domain: { $in: domainList } 
    }).select('name domain reliabilityScore trustLevel recentAccuracy biasRating totalArticles verifiedArticles');

    const comparison = {
      sources,
      summary: {
        highest: sources.reduce((max, source) => 
          source.reliabilityScore > max.reliabilityScore ? source : max, sources[0]),
        lowest: sources.reduce((min, source) => 
          source.reliabilityScore < min.reliabilityScore ? source : min, sources[0]),
        averageReliability: sources.reduce((sum, s) => sum + s.reliabilityScore, 0) / sources.length
      }
    };

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};