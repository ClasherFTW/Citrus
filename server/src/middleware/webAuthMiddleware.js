const ApiError = require("../utils/ApiError");
const { verifyFirebaseIdToken } = require("../config/firebaseAdmin");
const User = require("../models/User");

const extractToken = (req) => {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

const optionalWebAuth = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    res.locals.currentUser = null;
    return next();
  }

  try {
    const decoded = await verifyFirebaseIdToken(token, false);
    const user = await User.findOne({ firebaseUid: decoded.uid }).lean();
    req.webUser = user || null;
    res.locals.currentUser = user || null;
  } catch (_error) {
    req.webUser = null;
    res.locals.currentUser = null;
  }

  return next();
};

const requireWebAuthRedirect = (req, res, next) => {
  if (req.webUser) {
    return next();
  }

  const nextPath = encodeURIComponent(req.originalUrl || "/profile");
  return res.redirect(`/auth?next=${nextPath}`);
};

const requireIdToken = (req, _res, next) => {
  const idToken = String(req.body?.idToken || "").trim();
  if (!idToken) {
    return next(new ApiError(400, "idToken is required."));
  }

  req.idToken = idToken;
  return next();
};

module.exports = {
  optionalWebAuth,
  requireWebAuthRedirect,
  requireIdToken,
};
