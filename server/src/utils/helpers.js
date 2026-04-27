const toObjectIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }

    if ("_id" in value && value._id && value._id !== value) {
      return toObjectIdString(value._id);
    }
  }

  if (typeof value.toString === "function") {
    return value.toString();
  }

  return "";
};

const sanitizeTags = (tagsInput) => {
  const tagsArray = Array.isArray(tagsInput)
    ? tagsInput
    : String(tagsInput || "")
        .split(",")
        .map((tag) => tag.trim());

  return [...new Set(tagsArray.filter(Boolean).map((tag) => tag.toLowerCase()))];
};

const getPagination = ({ page = 1, limit = 10 }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 50)
      : 10;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const getVoteState = (votes, userId) => {
  if (!userId || !votes) return 0;
  const normalizedUserId = toObjectIdString(userId);

  const upvoted = (votes.upvoters || []).some(
    (id) => toObjectIdString(id) === normalizedUserId
  );
  if (upvoted) return 1;

  const downvoted = (votes.downvoters || []).some(
    (id) => toObjectIdString(id) === normalizedUserId
  );
  if (downvoted) return -1;

  return 0;
};

const getVoteScore = (votes) =>
  (votes?.upvoters?.length || 0) - (votes?.downvoters?.length || 0);

const serializeQuestion = (question, currentUserId = null) => {
  const doc = question.toObject ? question.toObject() : question;
  const voteScore =
    typeof doc.voteScore === "number" ? doc.voteScore : getVoteScore(doc.votes);
  const userVote = getVoteState(doc.votes, currentUserId);

  return {
    ...doc,
    voteScore,
    userVote,
  };
};

const serializeAnswer = (answer, currentUserId = null) => {
  const doc = answer.toObject ? answer.toObject() : answer;
  const voteScore =
    typeof doc.voteScore === "number" ? doc.voteScore : getVoteScore(doc.votes);
  const userVote = getVoteState(doc.votes, currentUserId);

  return {
    ...doc,
    voteScore,
    userVote,
  };
};

const applyVoteTransition = (votes, userId, voteType) => {
  const normalizedUserId = toObjectIdString(userId);
  const upvoters = [...(votes.upvoters || [])];
  const downvoters = [...(votes.downvoters || [])];

  const hasUpvote = upvoters.some(
    (id) => toObjectIdString(id) === normalizedUserId
  );
  const hasDownvote = downvoters.some(
    (id) => toObjectIdString(id) === normalizedUserId
  );

  const previousVote = hasUpvote ? 1 : hasDownvote ? -1 : 0;

  const nextUpvoters = upvoters.filter(
    (id) => toObjectIdString(id) !== normalizedUserId
  );
  const nextDownvoters = downvoters.filter(
    (id) => toObjectIdString(id) !== normalizedUserId
  );

  if (voteType === "upvote" && !hasUpvote) {
    nextUpvoters.push(userId);
  }

  if (voteType === "downvote" && !hasDownvote) {
    nextDownvoters.push(userId);
  }

  const currentVote =
    voteType === "upvote" ? (hasUpvote ? 0 : 1) : hasDownvote ? 0 : -1;

  return {
    upvoters: nextUpvoters,
    downvoters: nextDownvoters,
    previousVote,
    currentVote,
  };
};

const calculateReputationDelta = (previousVote, currentVote, scoreConfig) => {
  const mapVoteToScore = (voteValue) => {
    if (voteValue === 1) return scoreConfig.upvote;
    if (voteValue === -1) return -Math.abs(scoreConfig.downvotePenalty);
    return 0;
  };

  return mapVoteToScore(currentVote) - mapVoteToScore(previousVote);
};

module.exports = {
  sanitizeTags,
  getPagination,
  getVoteState,
  getVoteScore,
  serializeQuestion,
  serializeAnswer,
  applyVoteTransition,
  calculateReputationDelta,
  toObjectIdString,
};
