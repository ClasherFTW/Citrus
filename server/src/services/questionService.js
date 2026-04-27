const Answer = require("../models/Answer");
const Question = require("../models/Question");
const ApiError = require("../utils/ApiError");
const {
  sanitizeTags,
  getPagination,
  serializeQuestion,
  applyVoteTransition,
  calculateReputationDelta,
  getVoteScore,
  toObjectIdString,
} = require("../utils/helpers");
const { applyReputationDelta } = require("./reputationService");

const QUESTION_REPUTATION = {
  upvote: 5,
  downvotePenalty: 2,
};

const canManageQuestion = (question, actor) =>
  actor.role === "admin" || toObjectIdString(question.userId) === toObjectIdString(actor._id);

const createQuestion = async ({ title, description, tags, userId }) => {
  const question = await Question.create({
    title,
    description,
    tags: sanitizeTags(tags),
    userId,
  });

  const populatedQuestion = await Question.findById(question._id).populate(
    "userId",
    "username reputation role"
  );

  return serializeQuestion(populatedQuestion, userId);
};

const listQuestions = async ({
  page,
  limit,
  search,
  tags,
  askedBy,
  sortBy = "newest",
  currentUserId = null,
}) => {
  const { skip, page: safePage, limit: safeLimit } = getPagination({ page, limit });

  const query = {};
  if (search?.trim()) {
    query.$text = { $search: search.trim() };
  }

  const normalizedTags = sanitizeTags(tags);
  if (normalizedTags.length > 0) {
    query.tags = { $in: normalizedTags };
  }

  if (askedBy) {
    query.userId = askedBy;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    votes: { voteScore: -1, createdAt: -1 },
    answers: { answersCount: -1, createdAt: -1 },
    relevance: { createdAt: -1 },
  };

  const sort = sortMap[sortBy] || sortMap.newest;

  const [rows, total] = await Promise.all([
    Question.find(query)
      .populate("userId", "username reputation role")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Question.countDocuments(query),
  ]);

  return {
    items: rows.map((item) => serializeQuestion(item, currentUserId)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const getQuestionById = async (questionId, currentUserId = null) => {
  const question = await Question.findById(questionId).populate(
    "userId",
    "username reputation role"
  );

  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  return serializeQuestion(question, currentUserId);
};

const updateQuestion = async (questionId, actor, payload) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  if (!canManageQuestion(question, actor)) {
    throw new ApiError(403, "You can edit only your own question.");
  }

  if (payload.title !== undefined) question.title = payload.title;
  if (payload.description !== undefined) question.description = payload.description;
  if (payload.tags !== undefined) question.tags = sanitizeTags(payload.tags);

  await question.save();
  await question.populate("userId", "username reputation role");

  return serializeQuestion(question, actor._id);
};

const deleteQuestion = async (questionId, actor) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  if (!canManageQuestion(question, actor)) {
    throw new ApiError(403, "You can delete only your own question.");
  }

  await Promise.all([
    Answer.deleteMany({ questionId: question._id }),
    question.deleteOne(),
  ]);
};

const voteQuestion = async ({ questionId, voterUserId, voteType }) => {
  const question = await Question.findById(questionId).populate(
    "userId",
    "username reputation role"
  );

  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  if (toObjectIdString(question.userId._id) === toObjectIdString(voterUserId)) {
    throw new ApiError(400, "You cannot vote on your own question.");
  }

  const { upvoters, downvoters, previousVote, currentVote } = applyVoteTransition(
    question.votes,
    voterUserId,
    voteType
  );

  question.votes.upvoters = upvoters;
  question.votes.downvoters = downvoters;
  question.voteScore = getVoteScore(question.votes);
  await question.save();

  const reputationDelta = calculateReputationDelta(
    previousVote,
    currentVote,
    QUESTION_REPUTATION
  );
  await applyReputationDelta(question.userId._id, reputationDelta);
  await question.populate("userId", "username reputation role");

  return {
    question: serializeQuestion(question, voterUserId),
    reputationDelta,
  };
};

module.exports = {
  createQuestion,
  listQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
};
