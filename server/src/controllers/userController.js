const asyncHandler = require("../utils/asyncHandler");
const { getProfileById, listPublicProfiles } = require("../services/userService");

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileById(req.user._id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileById(req.params.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const result = await listPublicProfiles({
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
    excludeUserId: req.user?._id || null,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  getMyProfile,
  getUserProfile,
  listUsers,
};
