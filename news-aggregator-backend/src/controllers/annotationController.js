const Annotation = require("../models/Annotation");

exports.createAnnotation = async (req, res) => {
  try {
    const { articleId, highlightedText, startIndex, endIndex, claim, evidenceUrl } = req.body;

    if (!articleId || !highlightedText || !claim || startIndex == null || endIndex == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newAnnotation = new Annotation({
      articleId,
      highlightedText,
      startIndex,
      endIndex,
      claim,
      evidenceUrl,
      submittedBy: req.user.id,
    });

    await newAnnotation.save();

    res.status(201).json({ message: "Annotation created", annotation: newAnnotation });
  } catch (err) {
    console.error("Create annotation error:", err.message);
    res.status(500).json({ message: "Failed to create annotation" });
  }
};


exports.getAnnotationsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;

    const annotations = await Annotation.find({ articleId }).populate("submittedBy", "name email");

    res.status(200).json({ annotations });
  } catch (err) {
    console.error("Get annotations error:", err.message);
    res.status(500).json({ message: "Failed to fetch annotations" });
  }
};

const Vote = require("../models/Vote");

exports.voteAnnotation = async (req, res) => {
  try {
    const { id } = req.params; // annotation ID
    const { type } = req.body; // 'credible' or 'not-credible'

    const annotation = await Annotation.findById(id);
    if (!annotation) return res.status(404).json({ message: "Annotation not found" });

    // Check if user already voted
    const existingVote = await Vote.findOne({
      userId: req.user.id,
      targetId: id,
      targetType: "annotation"
    });

    if (!existingVote) {
      // Add new vote
      annotation.credibilityVotes += type === "credible" ? 1 : -1;

      await annotation.save();
      await new Vote({
        userId: req.user.id,
        targetId: id,
        targetType: "annotation",
        type
      }).save();

      return res.status(200).json({
        message: "Vote added",
        credibilityVotes: annotation.credibilityVotes,
        userVote: type
      });
    }

    if (existingVote.type === type) {
      // Remove vote if same clicked again
      annotation.credibilityVotes += type === "credible" ? -1 : 1;

      await annotation.save();
      await existingVote.deleteOne();

      return res.status(200).json({
        message: "Vote removed",
        credibilityVotes: annotation.credibilityVotes,
        userVote: null
      });
    }

    // Switch vote
    annotation.credibilityVotes += type === "credible" ? 2 : -2; // flip
    existingVote.type = type;

    await annotation.save();
    await existingVote.save();

    res.status(200).json({
      message: "Vote switched",
      credibilityVotes: annotation.credibilityVotes,
      userVote: type
    });
  } catch (err) {
    console.error("Vote annotation error:", err.message);
    res.status(500).json({ message: "Voting failed" });
  }
};

