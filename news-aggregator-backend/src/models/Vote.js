const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ["article", "annotation", "factcheck"], required: true },
    type: { type: String, enum: ["upvote", "downvote", "credible", "not-credible"], required: true },
  },
  { timestamps: true }
);

voteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
