const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { vote, getVotes } = require("../controllers/voteController");

router.post("/:id", protect, vote); // Unified voting
router.get("/:id", protect, getVotes); // Get current vote state

module.exports = router;
