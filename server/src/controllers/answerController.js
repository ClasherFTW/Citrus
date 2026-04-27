const asyncHandler = require("../utils/asyncHandler");
const answerService = require("../services/answerService");

const createAnswer = asyncHandler(async (req, res) => {
  const answer = await answerService.createAnswer({
    questionId: req.body.questionId,
    userId: req.user._id,
    content: req.body.content,
  });

  res.status(201).json({
    success: true,
    message: "Answer posted successfully.",
    data: answer,
  });
});

const listAnswersByQuestion = asyncHandler(async (req, res) => {
  const result = await answerService.listAnswersByQuestion({
    questionId: req.params.questionId,
    page: req.query.page,
    limit: req.query.limit,
    sortBy: req.query.sortBy,
    currentUserId: req.user?._id || null,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const updateAnswer = asyncHandler(async (req, res) => {
  const answer = await answerService.updateAnswer({
    answerId: req.params.id,
    actor: req.user,
    content: req.body.content,
  });

  res.status(200).json({
    success: true,
    message: "Answer updated successfully.",
    data: answer,
  });
});

const deleteAnswer = asyncHandler(async (req, res) => {
  await answerService.deleteAnswer({
    answerId: req.params.id,
    actor: req.user,
  });

  res.status(200).json({
    success: true,
    message: "Answer deleted successfully.",
  });
});

const voteAnswer = asyncHandler(async (req, res) => {
  const result = await answerService.voteAnswer({
    answerId: req.params.id,
    voterUserId: req.user._id,
    voteType: req.body.voteType,
  });

  res.status(200).json({
    success: true,
    message: "Vote updated successfully.",
    data: result,
  });
});

module.exports = {
  createAnswer,
  listAnswersByQuestion,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
};
