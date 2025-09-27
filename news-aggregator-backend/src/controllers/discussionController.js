const Discussion = require('../models/Discussion');
const User = require('../models/User');
const Article = require('../models/Article');
const Vote = require('../models/Vote');

// 🔹 Create new discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, articleId, category, tags } = req.body;
    
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // If articleId provided, verify article exists
    if (articleId) {
      const article = await Article.findById(articleId);
      if (!article) {
        return res.status(404).json({ message: 'Referenced article not found' });
      }
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
      articleId: articleId || undefined,
      category: category || 'general',
      tags: tags ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0) : []
    });

    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'username name reputation level badges')
      .populate('articleId', 'title sourceName');

    res.status(201).json({
      message: 'Discussion created successfully',
      discussion: populatedDiscussion
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Get discussions with filtering and pagination
exports.getDiscussions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      articleId,
      sortBy = 'lastActivity',
      sortOrder = 'desc',
      search
    } = req.query;

    const filter = { isDeleted: false };
    if (category && category !== 'all') filter.category = category;
    if (articleId) filter.articleId = articleId;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Always prioritize pinned discussions
    const sortCriteria = { isPinned: -1, ...sort };

    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .populate('author', 'username name reputation level badges')
        .populate('articleId', 'title sourceName')
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit)),
      Discussion.countDocuments(filter)
    ]);

    res.json({
      discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Get single discussion with replies
exports.getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findById(id)
      .populate('author', 'username name reputation level badges')
      .populate('articleId', 'title sourceName url')
      .populate('replies.userId', 'username name reputation level badges');

    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Increment view count
    await Discussion.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // Get user votes if authenticated
    let userVotes = {};
    if (req.user) {
      const votes = await Vote.find({
        userId: req.user._id,
        targetType: 'discussion',
        $or: [
          { targetId: id },
          { targetId: { $in: discussion.replies.map(r => r._id) } }
        ]
      });
      
      votes.forEach(vote => {
        userVotes[vote.targetId.toString()] = vote.type;
      });
    }

    const discussionObj = discussion.toObject();
    discussionObj.userVote = userVotes[id] || null;
    discussionObj.replies = discussionObj.replies.map(reply => ({
      ...reply,
      userVote: userVotes[reply._id.toString()] || null
    }));

    res.json({ discussion: discussionObj });
  } catch (error) {
    console.error('Get discussion by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Add reply to discussion
exports.addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentReply } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const discussion = await Discussion.findById(id);
    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.isLocked) {
      return res.status(403).json({ message: 'Discussion is locked' });
    }

    const newReply = {
      userId: req.user._id,
      content: content.trim(),
      parentReply: parentReply || undefined
    };

    discussion.replies.push(newReply);
    discussion.lastActivity = new Date();
    await discussion.save();

    const updatedDiscussion = await Discussion.findById(id)
      .populate('replies.userId', 'username name reputation level badges');

    const addedReply = updatedDiscussion.replies[updatedDiscussion.replies.length - 1];

    res.status(201).json({
      message: 'Reply added successfully',
      reply: addedReply
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Vote on discussion or reply
exports.voteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType, replyId } = req.body; // voteType: 'upvote' or 'downvote'
    
    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const discussion = await Discussion.findById(id);
    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const targetId = replyId || id;
    const isReply = !!replyId;

    // Don't allow voting on own content
    if (!isReply && discussion.author.toString() === req.user._id.toString()) {
      console.log(`User ${req.user._id} tried to vote on their own discussion ${id}`);
      return res.status(403).json({ 
        message: "You can't vote on your own discussion",
        isOwnContent: true
      });
    }

    if (isReply) {
      const reply = discussion.replies.id(replyId);
      if (!reply || reply.isDeleted) {
        return res.status(404).json({ message: 'Reply not found' });
      }
      if (reply.userId.toString() === req.user._id.toString()) {
        console.log(`User ${req.user._id} tried to vote on their own reply ${replyId}`);
        return res.status(403).json({ 
          message: "You can't vote on your own reply",
          isOwnContent: true
        });
      }
    }

    // Handle voting logic similar to articles
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      targetId: targetId,
      targetType: 'discussion'
    });

    let voteAction = 'added';
    let upvoteChange = 0;
    let downvoteChange = 0;
    let userVote = voteType;

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote (toggle)
        await Vote.deleteOne({ _id: existingVote._id });
        voteAction = 'removed';
        userVote = null;
        if (voteType === 'upvote') upvoteChange = -1;
        else downvoteChange = -1;
      } else {
        // Switch vote
        await Vote.findByIdAndUpdate(existingVote._id, { type: voteType });
        voteAction = 'switched';
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
        targetId: targetId,
        targetType: 'discussion',
        type: voteType
      });
      
      if (voteType === 'upvote') upvoteChange = 1;
      else downvoteChange = 1;
    }

    // Update vote counts
    if (isReply) {
      const reply = discussion.replies.id(replyId);
      reply.upvotes += upvoteChange;
      reply.downvotes += downvoteChange;
      reply.totalVotes = reply.upvotes - reply.downvotes;
    } else {
      discussion.upvotes += upvoteChange;
      discussion.downvotes += downvoteChange;
      discussion.totalVotes = discussion.upvotes - discussion.downvotes;
    }

    await discussion.save();

    // Update reputation of the content author
    if (voteType === 'upvote' && voteAction === 'added') {
      const authorId = isReply ? discussion.replies.id(replyId).userId : discussion.author;
      await User.findByIdAndUpdate(authorId, { $inc: { reputation: 2 } });
    } else if (voteType === 'downvote' && voteAction === 'added') {
      const authorId = isReply ? discussion.replies.id(replyId).userId : discussion.author;
      await User.findByIdAndUpdate(authorId, { $inc: { reputation: -1 } });
    }

    const updatedVotes = isReply ? {
      upvotes: discussion.replies.id(replyId).upvotes,
      downvotes: discussion.replies.id(replyId).downvotes,
      totalVotes: discussion.replies.id(replyId).totalVotes
    } : {
      upvotes: discussion.upvotes,
      downvotes: discussion.downvotes,
      totalVotes: discussion.totalVotes
    };

    res.json({
      message: `Vote ${voteAction} successfully`,
      userVote,
      ...updatedVotes
    });
  } catch (error) {
    console.error('Vote discussion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Delete discussion (author only)
exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findById(id);
    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own discussions' });
    }

    discussion.isDeleted = true;
    await discussion.save();

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Delete reply (author only)
exports.deleteReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    
    const discussion = await Discussion.findById(id);
    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply || reply.isDeleted) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own replies' });
    }

    reply.isDeleted = true;
    discussion.lastActivity = new Date();
    await discussion.save();

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔹 Edit reply (author only)
exports.editReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const { content } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const discussion = await Discussion.findById(id);
    if (!discussion || discussion.isDeleted) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply || reply.isDeleted) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own replies' });
    }

    reply.content = content.trim();
    reply.editedAt = new Date();
    await discussion.save();

    const updatedDiscussion = await Discussion.findById(id)
      .populate('replies.userId', 'username name reputation level badges');

    const updatedReply = updatedDiscussion.replies.id(replyId);

    res.json({
      message: 'Reply updated successfully',
      reply: updatedReply
    });
  } catch (error) {
    console.error('Edit reply error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};