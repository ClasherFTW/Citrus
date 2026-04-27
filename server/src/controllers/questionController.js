const asyncHandler = require("../utils/asyncHandler");
const questionService = require("../services/questionService");

const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion({
    title: req.body.title,
    description: req.body.description,
    tags: req.body.tags,
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Question created successfully.",
    data: question,
  });
});

const listQuestions = asyncHandler(async (req, res) => {
  const result = await questionService.listQuestions({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    tags: req.query.tags,
    askedBy: req.query.askedBy,
    sortBy: req.query.sortBy,
    currentUserId: req.user?._id || null,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getQuestionById = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestionById(
    req.params.id,
    req.user?._id || null
  );

  res.status(200).json({
    success: true,
    data: question,
  });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.user, req.body);

  res.status(200).json({
    success: true,
    message: "Question updated successfully.",
    data: question,
  });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.user);

  res.status(200).json({
    success: true,
    message: "Question deleted successfully.",
  });
});

const voteQuestion = asyncHandler(async (req, res) => {
  const result = await questionService.voteQuestion({
    questionId: req.params.id,
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
  createQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
};
