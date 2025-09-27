const User = require("../models/User");
const Notification = require("../models/Notification");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");

// Register
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password, role, specialties } = req.body;

    // Check if user already exists by email or username
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? "Email already exists" : "Username already exists" 
      });
    }

    const user = await User.create({ 
      name, 
      username, 
      email, 
      password, 
      role,
      specialties: specialties || [],
      reputation: 100, // Starting reputation
      badges: ['Newcomer']
    });

    // Create welcome notification
    await Notification.createNotification({
      userId: user._id,
      type: 'system_update',
      title: 'Welcome to TruthHub!',
      message: 'Start your fact-checking journey by verifying your first article.',
      actionable: true,
      actionUrl: '/dashboard',
      actionText: 'Get Started',
      icon: 'CheckCircle',
      color: 'green',
      category: 'system'
    });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        reputation: user.reputation,
        badges: user.badges,
        level: user.level,
        specialties: user.specialties,
        articlesVerified: user.articlesVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// Login - Support both email and username
exports.login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    
    if (!username && !email) {
      return res.status(400).json({ message: "Username or email is required" });
    }

    // Find user by email or username
    const identifier = username || email;
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { username: identifier }]
    });
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({ 
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        reputation: user.reputation,
        badges: user.badges,
        level: user.level,
        specialties: user.specialties,
        articlesVerified: user.articlesVerified,
        bio: user.bio
      },
      accessToken, 
      refreshToken 
    });
  } catch (error) {
    next(error);
  }
};

// Profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const unreadNotifications = await Notification.getUnreadCountForUser(req.user.id);
    
    res.json({
      user: {
        ...user.toObject(),
        unreadNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, website, location, specialties } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        bio,
        website,
        location,
        specialties,
        lastActiveAt: new Date()
      },
      { new: true, runValidators: true }
    ).select("-password");
    
    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    next(error);
  }
};

// Get user stats for dashboard
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Import models here to avoid circular dependency
    const Article = require("../models/Article");
    const FactCheck = require("../models/FactCheck");
    
    const [
      submittedArticles,
      factChecksSubmitted,
      articlesVerified,
      disputedArticles,
      recentActivity
    ] = await Promise.all([
      Article.countDocuments({ submittedBy: userId }),
      FactCheck.countDocuments({ reviewer: userId }),
      Article.countDocuments({ submittedBy: userId, status: 'verified' }),
      Article.countDocuments({ submittedBy: userId, status: 'disputed' }),
      Article.find({ submittedBy: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status createdAt credibilityScore')
    ]);
    
    res.json({
      submittedArticles,
      factChecksSubmitted,
      articlesVerified,
      disputedArticles,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

// Get platform statistics
exports.getPlatformStats = async (req, res, next) => {
  try {
    // Import models here to avoid circular dependency
    const Article = require("../models/Article");
    
    const [
      totalArticles,
      verifiedArticles,
      underReviewArticles,
      disputedArticles
    ] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: 'verified' }),
      Article.countDocuments({ status: 'pending' }),
      Article.countDocuments({ status: 'disputed' })
    ]);
    
    res.json({
      totalArticles,
      verifiedArticles,
      underReviewArticles,
      disputedArticles
    });
  } catch (error) {
    next(error);
  }
};

// Get public user profile
exports.getPublicProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select("-password -email");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Import models here to avoid circular dependency
    const Article = require("../models/Article");
    const FactCheck = require("../models/FactCheck");
    
    const [submittedArticles, factChecksCount] = await Promise.all([
      Article.countDocuments({ submittedBy: user._id }),
      FactCheck.countDocuments({ reviewer: user._id })
    ]);
    
    res.json({
      ...user.toObject(),
      submittedArticles,
      factChecksCount
    });
  } catch (error) {
    next(error);
  }
};

// Get user achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const { getUserAchievementProgress } = require('../utils/achievements');
    const progress = await getUserAchievementProgress(req.user._id);
    
    res.json(progress);
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, sortBy = 'reputation' } = req.query;
    
    const sortField = {};
    sortField[sortBy] = -1;
    
    const users = await User.find({ isActive: true })
      .select('username reputation totalPoints articlesSubmitted articlesVerified level badges')
      .sort(sortField)
      .limit(parseInt(limit))
      .lean();
    
    // Add ranking
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

// Admin-only example
exports.adminOnly = async (req, res, next) => {
  try {
    res.json({ message: `Hello Admin ${req.user.name}` });
  } catch (error) {
    next(error);
  }
};
