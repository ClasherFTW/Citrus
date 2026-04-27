const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getPagination, toObjectIdString } = require("../utils/helpers");

const pickPublicProfile = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  reputation: user.reputation,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProfileStats = async (userId) => {
  const [questionCount, answerCount, topTags] = await Promise.all([
    Question.countDocuments({ userId }),
    Answer.countDocuments({ userId }),
    Question.aggregate([
      { $match: { userId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]),
  ]);

  return {
    questionCount,
    answerCount,
    topTags,
  };
};

const getProfileById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const stats = await getProfileStats(user._id);

  return {
    ...pickPublicProfile(user),
    stats,
  };
};

const listPublicProfiles = async ({
  search = "",
  page = 1,
  limit = 20,
  excludeUserId = null,
}) => {
  const { skip, page: safePage, limit: safeLimit } = getPagination({ page, limit });
  const query = {};

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  if (search?.trim()) {
    const pattern = search.trim();
    query.$or = [
      { username: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
    ];
  }

  const [rows, total] = await Promise.all([
    User.find(query)
      .select("username email role reputation bio avatarUrl createdAt updatedAt")
      .sort({ reputation: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    items: rows.map((user) => ({
      ...user,
      id: toObjectIdString(user._id),
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

module.exports = {
  getProfileById,
  listPublicProfiles,
};
