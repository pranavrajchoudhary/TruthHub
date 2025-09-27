// models/Annotation.js
const mongoose = require("mongoose");

const AnnotationSchema = new mongoose.Schema(
  {
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article", required: true },
    highlightedText: { type: String, required: true },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
    claim: { type: String, required: true },
    evidenceUrl: { type: String }, // supporting or refuting evidence
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    credibilityVotes: { type: Number, default: 0 }, // net credibility score
  },
  { timestamps: true }
);

module.exports = mongoose.model("Annotation", AnnotationSchema);
