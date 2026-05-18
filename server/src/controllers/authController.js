const asyncHandler = require("../utils/asyncHandler");
const { pickPublicUser, syncUserFromFirebase } = require("../services/authService");
const { revokeFirebaseUserSessions, verifyFirebaseIdToken } = require("../config/firebaseAdmin");

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

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

const logout = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseAuth?.uid;
  if (firebaseUid) {
    await revokeFirebaseUserSessions(firebaseUid);
  }

  res.clearCookie("accessToken", COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Logout successful. Session revoked.",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: pickPublicUser(req.user),
  });
});

const createSession = asyncHandler(async (req, res) => {
  const decoded = await verifyFirebaseIdToken(req.idToken, false);

  await syncUserFromFirebase({
    firebaseAuth: decoded,
    preferredUsername: req.body.username,
    avatarUrl: req.body.avatarUrl,
  });

  res.cookie("accessToken", req.idToken, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Session established.",
  });
});

const clearSession = asyncHandler(async (_req, res) => {
  res.clearCookie("accessToken", COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: "Session cleared.",
  });
});

module.exports = {
  syncProfile,
  logout,
  getMe,
  createSession,
  clearSession,
};
