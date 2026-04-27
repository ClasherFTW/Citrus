const express = require("express");
const questionController = require("../controllers/questionController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { questionValidators } = require("../utils/validators");

const router = express.Router();

router.get("/", optionalAuth, questionValidators.list, validateRequest, questionController.listQuestions);
router.get(
  "/:id",
  optionalAuth,
  questionValidators.getOne,
  validateRequest,
  questionController.getQuestionById
);

router.post("/", protect, questionValidators.create, validateRequest, questionController.createQuestion);
router.patch("/:id", protect, questionValidators.update, validateRequest, questionController.updateQuestion);
router.delete("/:id", protect, questionValidators.getOne, validateRequest, questionController.deleteQuestion);
router.post("/:id/vote", protect, questionValidators.vote, validateRequest, questionController.voteQuestion);

module.exports = router;
