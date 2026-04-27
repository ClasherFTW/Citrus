const asyncHandler = require("../utils/asyncHandler");
const { pickPublicUser, syncUserFromFirebase } = require("../services/authService");

const syncProfile = asyncHandler(async (req, res) => {
  const user = await syncUserFromFirebase({
    firebaseAuth: req.firebaseAuth,
    preferredUsername: req.body.username,
    avatarUrl: req.body.avatarUrl,
  });

  res.status(200).json({
    success: true,
    message: "Firebase profile synced.",
    data: user,
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: pickPublicUser(req.user),
  });
});

module.exports = {
  syncProfile,
  logout,
  getMe,
};
