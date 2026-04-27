const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const pickPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  reputation: user.reputation,
  bio: user.bio,
  avatarUrl: user.avatarUrl,
  firebaseUid: user.firebaseUid,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sanitizeUsername = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

const buildUsernameCandidates = ({ preferredUsername, displayName, email, firebaseUid }) => {
  const emailPrefix = String(email || "").split("@")[0].trim();
  const uidTail = String(firebaseUid || "").slice(-6).toLowerCase();
  const randomTail = Math.floor(Math.random() * 9000 + 1000);

  const base =
    sanitizeUsername(preferredUsername) ||
    sanitizeUsername(displayName) ||
    sanitizeUsername(emailPrefix) ||
    "citrus_user";

  return [
    base,
    `${base}_${uidTail}`.slice(0, 30),
    `${base}_${randomTail}`.slice(0, 30),
  ];
};

const resolveUniqueUsername = async ({ preferredUsername, displayName, email, firebaseUid }) => {
  const candidates = buildUsernameCandidates({
    preferredUsername,
    displayName,
    email,
    firebaseUid,
  });

  for (const candidate of candidates) {
    const exists = await User.exists({ username: candidate });
    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError(409, "Unable to create a unique username for this Firebase account.");
};

const syncUserFromFirebase = async ({ firebaseAuth, preferredUsername, avatarUrl }) => {
  const firebaseUid = firebaseAuth?.uid;
  const email = String(firebaseAuth?.email || "").toLowerCase();
  const displayName = firebaseAuth?.name || "";
  const photoFromToken = firebaseAuth?.picture || "";

  if (!firebaseUid || !email) {
    throw new ApiError(400, "Firebase token must contain uid and email.");
  }

  let user = await User.findOne({ firebaseUid });

  if (!user) {
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      if (existingByEmail.firebaseUid && existingByEmail.firebaseUid !== firebaseUid) {
        throw new ApiError(409, "This email is already linked to another Firebase account.");
      }

      existingByEmail.firebaseUid = firebaseUid;
      if (!existingByEmail.avatarUrl) {
        existingByEmail.avatarUrl = avatarUrl || photoFromToken || "";
      }
      if (!existingByEmail.username) {
        existingByEmail.username = await resolveUniqueUsername({
          preferredUsername,
          displayName,
          email,
          firebaseUid,
        });
      }

      user = await existingByEmail.save();
    } else {
      const username = await resolveUniqueUsername({
        preferredUsername,
        displayName,
        email,
        firebaseUid,
      });

      user = await User.create({
        firebaseUid,
        username,
        email,
        avatarUrl: avatarUrl || photoFromToken || "",
      });
    }
  } else {
    let shouldSave = false;

    if (user.email !== email) {
      user.email = email;
      shouldSave = true;
    }

    if ((avatarUrl || photoFromToken) && !user.avatarUrl) {
      user.avatarUrl = avatarUrl || photoFromToken;
      shouldSave = true;
    }

    if (shouldSave) {
      user = await user.save();
    }
  }

  return pickPublicUser(user);
};

module.exports = {
  pickPublicUser,
  syncUserFromFirebase,
};
