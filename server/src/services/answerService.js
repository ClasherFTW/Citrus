const Answer = require("../models/Answer");
const Question = require("../models/Question");
const ApiError = require("../utils/ApiError");
const {
  getPagination,
  serializeAnswer,
  applyVoteTransition,
  calculateReputationDelta,
  getVoteScore,
  toObjectIdString,
} = require("../utils/helpers");
const { applyReputationDelta } = require("./reputationService");

const ANSWER_REPUTATION = {
  upvote: 10,
  downvotePenalty: 2,
};

const canManageAnswer = (answer, actor) =>
  actor.role === "admin" || toObjectIdString(answer.userId) === toObjectIdString(actor._id);

const createAnswer = async ({ questionId, userId, content }) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  const answer = await Answer.create({
    questionId,
    userId,
    content,
  });

  question.answersCount += 1;
  await question.save();

  const populatedAnswer = await Answer.findById(answer._id).populate(
    "userId",
    "username reputation role"
  );

  return serializeAnswer(populatedAnswer, userId);
};

const listAnswersByQuestion = async ({
  questionId,
  page,
  limit,
  sortBy = "newest",
  currentUserId = null,
}) => {
  const question = await Question.findById(questionId).select("_id");
  if (!question) {
    throw new ApiError(404, "Question not found.");
  }

  const { skip, page: safePage, limit: safeLimit } = getPagination({ page, limit });
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    votes: { voteScore: -1, createdAt: -1 },
  };
  const sort = sortMap[sortBy] || sortMap.newest;

  const [rows, total] = await Promise.all([
    Answer.find({ questionId })
      .populate("userId", "username reputation role")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Answer.countDocuments({ questionId }),
  ]);

  return {
    items: rows.map((item) => serializeAnswer(item, currentUserId)),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const updateAnswer = async ({ answerId, actor, content }) => {
  const answer = await Answer.findById(answerId);
  if (!answer) {
    throw new ApiError(404, "Answer not found.");
  }

  if (!canManageAnswer(answer, actor)) {
    throw new ApiError(403, "You can edit only your own answer.");
  }

  answer.content = content;
  await answer.save();
  await answer.populate("userId", "username reputation role");

  return serializeAnswer(answer, actor._id);
};

const deleteAnswer = async ({ answerId, actor }) => {
  const answer = await Answer.findById(answerId);
  if (!answer) {
    throw new ApiError(404, "Answer not found.");
  }

  if (!canManageAnswer(answer, actor)) {
    throw new ApiError(403, "You can delete only your own answer.");
  }

  await Promise.all([
    Question.updateOne(
      { _id: answer.questionId, answersCount: { $gt: 0 } },
      { $inc: { answersCount: -1 } }
    ),
    answer.deleteOne(),
  ]);
};

const voteAnswer = async ({ answerId, voterUserId, voteType }) => {
  const answer = await Answer.findById(answerId).populate("userId", "username reputation role");
  if (!answer) {
    throw new ApiError(404, "Answer not found.");
  }

  if (toObjectIdString(answer.userId._id) === toObjectIdString(voterUserId)) {
    throw new ApiError(400, "You cannot vote on your own answer.");
  }

  const { upvoters, downvoters, previousVote, currentVote } = applyVoteTransition(
    answer.votes,
    voterUserId,
    voteType
  );

  answer.votes.upvoters = upvoters;
  answer.votes.downvoters = downvoters;
  answer.voteScore = getVoteScore(answer.votes);
  await answer.save();

  const reputationDelta = calculateReputationDelta(
    previousVote,
    currentVote,
    ANSWER_REPUTATION
  );
  await applyReputationDelta(answer.userId._id, reputationDelta);
  await answer.populate("userId", "username reputation role");

  return {
    answer: serializeAnswer(answer, voterUserId),
    reputationDelta,
  };
};

module.exports = {
  createAnswer,
  listAnswersByQuestion,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
};
