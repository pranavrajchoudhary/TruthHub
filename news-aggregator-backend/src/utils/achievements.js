// Achievement system for user gamification
const User = require('../models/User');

const ACHIEVEMENTS = {
  // Article submission achievements
  FIRST_ARTICLE: {
    id: 'first_article',
    name: 'First Article',
    description: 'Submit your first article',
    condition: (user) => user.articlesSubmitted >= 1,
    points: 10
  },
  PROLIFIC_SUBMITTER: {
    id: 'prolific_submitter',
    name: 'Prolific Submitter',
    description: 'Submit 10 articles',
    condition: (user) => user.articlesSubmitted >= 10,
    points: 50
  },
  ARTICLE_MASTER: {
    id: 'article_master',
    name: 'Article Master',
    description: 'Submit 50 articles',
    condition: (user) => user.articlesSubmitted >= 50,
    points: 200
  },

  // Fact-checking achievements
  FIRST_FACT_CHECK: {
    id: 'first_fact_check',
    name: 'First Fact Check',
    description: 'Submit your first fact check',
    condition: (user) => user.articlesVerified >= 1,
    points: 15
  },
  FACT_CHECKER: {
    id: 'fact_checker',
    name: 'Fact Checker',
    description: 'Verify 25 articles',
    condition: (user) => user.articlesVerified >= 25,
    points: 100
  },
  TRUTH_GUARDIAN: {
    id: 'truth_guardian',
    name: 'Truth Guardian',
    description: 'Verify 100 articles',
    condition: (user) => user.articlesVerified >= 100,
    points: 500
  },

  // Reputation achievements
  RISING_STAR: {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Reach 100 reputation points',
    condition: (user) => user.reputation >= 100,
    points: 25
  },
  TRUSTED_MEMBER: {
    id: 'trusted_member',
    name: 'Trusted Member',
    description: 'Reach 500 reputation points',
    condition: (user) => user.reputation >= 500,
    points: 75
  },
  EXPERT_CONTRIBUTOR: {
    id: 'expert_contributor',
    name: 'Expert Contributor',
    description: 'Reach 1000 reputation points',
    condition: (user) => user.reputation >= 1000,
    points: 150
  },

  // Voting achievements
  ACTIVE_VOTER: {
    id: 'active_voter',
    name: 'Active Voter',
    description: 'Cast 50 votes',
    condition: (user) => user.totalVotes >= 50,
    points: 30
  },
  DEMOCRACY_CHAMPION: {
    id: 'democracy_champion',
    name: 'Democracy Champion',
    description: 'Cast 200 votes',
    condition: (user) => user.totalVotes >= 200,
    points: 80
  }
};

/**
 * Check and award achievements for a user
 * @param {String} userId - User ID
 * @returns {Object} - Object containing newly awarded achievements and level info
 */
const checkAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { achievements: [], levelUp: null };

    const currentBadges = user.badges || [];
    const newAchievements = [];
    const oldLevel = user.level;

    // Check each achievement
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      // Skip if user already has this badge
      if (currentBadges.includes(achievement.name)) continue;

      // Check if user meets the condition
      if (achievement.condition(user)) {
        newAchievements.push(achievement);
        
        // Award the badge and points
        await User.findByIdAndUpdate(userId, {
          $push: { badges: achievement.name },
          $inc: { 
            reputation: achievement.points,
            totalPoints: achievement.points
          }
        });
      }
    }

    // Re-fetch user to check for level changes after point updates
    const updatedUser = await User.findById(userId);
    const newLevel = updatedUser.calculateLevel();
    const levelUp = oldLevel !== newLevel ? { from: oldLevel, to: newLevel } : null;

    // Update level if changed
    if (levelUp) {
      await User.findByIdAndUpdate(userId, { level: newLevel });
    }

    return { 
      achievements: newAchievements,
      levelUp 
    };
  } catch (error) {
    console.error('Achievement check error:', error);
    return { achievements: [], levelUp: null };
  }
};

/**
 * Get all available achievements
 * @returns {Array} - Array of all achievements
 */
const getAllAchievements = () => {
  return Object.values(ACHIEVEMENTS);
};

/**
 * Get user's progress towards achievements
 * @param {String} userId - User ID
 * @returns {Object} - User's achievement progress
 */
const getUserAchievementProgress = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return {};

    const progress = {};
    const currentBadges = user.badges || [];

    for (const achievement of Object.values(ACHIEVEMENTS)) {
      progress[achievement.id] = {
        ...achievement,
        earned: currentBadges.includes(achievement.name),
        progress: calculateProgress(achievement, user)
      };
    }

    return progress;
  } catch (error) {
    console.error('Achievement progress error:', error);
    return {};
  }
};

/**
 * Calculate progress percentage for an achievement
 * @param {Object} achievement - Achievement object
 * @param {Object} user - User object
 * @returns {Number} - Progress percentage (0-100)
 */
const calculateProgress = (achievement, user) => {
  // This is a simplified progress calculation
  // In a real implementation, you'd want more sophisticated logic
  
  if (achievement.id.includes('article') && achievement.id.includes('submit')) {
    const target = parseInt(achievement.description.match(/\d+/)?.[0] || '1');
    return Math.min((user.articlesSubmitted / target) * 100, 100);
  }
  
  if (achievement.id.includes('fact') || achievement.id.includes('verif')) {
    const target = parseInt(achievement.description.match(/\d+/)?.[0] || '1');
    return Math.min((user.articlesVerified / target) * 100, 100);
  }
  
  if (achievement.id.includes('reputation')) {
    const target = parseInt(achievement.description.match(/\d+/)?.[0] || '100');
    return Math.min((user.reputation / target) * 100, 100);
  }
  
  if (achievement.id.includes('vote')) {
    const target = parseInt(achievement.description.match(/\d+/)?.[0] || '50');
    return Math.min((user.totalVotes / target) * 100, 100);
  }

  return 0;
};

module.exports = {
  checkAchievements,
  getAllAchievements,
  getUserAchievementProgress,
  ACHIEVEMENTS
};