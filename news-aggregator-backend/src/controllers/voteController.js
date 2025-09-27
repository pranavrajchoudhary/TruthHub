const Article = require("../models/Article");
const Annotation = require("../models/Annotation");
const Vote = require("../models/Vote");
const User = require("../models/User");
const { checkAchievements } = require("../utils/achievements");

// 🔹 Unified vote function
exports.vote = async (req, res) => {
  try {
    const { id } = req.params; // targetId
    const { type } = req.body; // upvote/downvote/credible/not-credible
    const { targetType } = req.body; // "article" or "annotation"

    // Fetch target
    let target;
    if (targetType === "article") target = await Article.findById(id);
    else if (targetType === "annotation") target = await Annotation.findById(id);
    else return res.status(400).json({ message: "Invalid targetType" });

    if (!target) return res.status(404).json({ message: `${targetType} not found` });

    // Check existing vote
    const existingVote = await Vote.findOne({
      userId: req.user.id,
      targetId: id,
      targetType
    });

    // Define counters
    let upvoteField = targetType === "article" ? ["upvotes", "downvotes"] : ["credibilityVotes", null];

    if (!existingVote) {
      // Add new vote
      if (targetType === "article") {
        if (type === "upvote") target.upvotes += 1;
        else if (type === "downvote") target.downvotes += 1;
      } else {
        // annotation
        target.credibilityVotes += type === "credible" ? 1 : -1;
      }

      await target.save();
      await new Vote({ userId: req.user.id, targetId: id, targetType, type }).save();

      // Award points for voting (small amount)
      const pointsEarned = 2;
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 
          reputation: pointsEarned,
          totalPoints: pointsEarned,
          totalVotes: 1
        },
        lastActiveAt: new Date()
      });

      // Check for achievements
      const achievementResult = await checkAchievements(req.user.id);

      return res.status(200).json({
        message: "Vote added",
        target,
        userVote: type,
        pointsEarned,
        newAchievements: achievementResult.achievements,
        levelUp: achievementResult.levelUp
      });
    }

    if (existingVote.type === type) {
      // Remove vote
      if (targetType === "article") {
        if (type === "upvote") target.upvotes -= 1;
        if (type === "downvote") target.downvotes -= 1;
      } else {
        target.credibilityVotes += type === "credible" ? -1 : 1;
      }

      await target.save();
      await existingVote.deleteOne();

      return res.status(200).json({
        message: "Vote removed",
        target,
        userVote: null
      });
    }

    // Switch vote
    if (targetType === "article") {
      if (existingVote.type === "upvote" && type === "downvote") {
        target.upvotes -= 1;
        target.downvotes += 1;
      } else if (existingVote.type === "downvote" && type === "upvote") {
        target.downvotes -= 1;
        target.upvotes += 1;
      }
    } else {
      // annotation
      target.credibilityVotes += type === "credible" ? 2 : -2;
    }

    existingVote.type = type;
    await existingVote.save();
    await target.save();

    res.status(200).json({
      message: "Vote switched",
      target,
      userVote: type
    });
  } catch (err) {
    console.error("Vote error:", err.message);
    res.status(500).json({ message: "Voting failed" });
  }
};

exports.getVotes = async (req, res) => {
  try {
    const { id } = req.params; // targetId
    const { targetType } = req.query; // article or annotation

    let target;
    if (targetType === "article") target = await Article.findById(id);
    else if (targetType === "annotation") target = await Annotation.findById(id);
    else return res.status(400).json({ message: "Invalid targetType" });

    if (!target) return res.status(404).json({ message: `${targetType} not found` });

    let userVote = null;
    if (req.user) {
      const existingVote = await Vote.findOne({ userId: req.user.id, targetId: id, targetType });
      if (existingVote) userVote = existingVote.type;
    }

    res.status(200).json({
      target,
      userVote
    });
  } catch (err) {
    console.error("Get votes error:", err.message);
    res.status(500).json({ message: "Failed to fetch votes" });
  }
};
