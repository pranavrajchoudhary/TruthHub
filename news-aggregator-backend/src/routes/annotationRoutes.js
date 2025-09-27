const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  createAnnotation,
  getAnnotationsByArticle,
  voteAnnotation
} = require("../controllers/annotationController");

router.post("/", protect, createAnnotation); // create
router.get("/article/:articleId", getAnnotationsByArticle); // get all for article
router.post("/:id/vote", protect, voteAnnotation); // vote on annotation

module.exports = router;
