const express = require("express");
const answerController = require("../controllers/answerController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { answerValidators } = require("../utils/validators");

const router = express.Router();

router.get(
  "/question/:questionId",
  optionalAuth,
  answerValidators.getByQuestion,
  validateRequest,
  answerController.listAnswersByQuestion
);

router.post("/", protect, answerValidators.create, validateRequest, answerController.createAnswer);
router.patch("/:id", protect, answerValidators.update, validateRequest, answerController.updateAnswer);
router.delete("/:id", protect, answerValidators.remove, validateRequest, answerController.deleteAnswer);
router.post("/:id/vote", protect, answerValidators.vote, validateRequest, answerController.voteAnswer);

module.exports = router;
