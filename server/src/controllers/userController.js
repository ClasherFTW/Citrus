const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { cloudinary, getMissingCloudinaryEnvKeys } = require("../config/cloudinary");
const {
  getProfileById,
  listPublicProfiles,
  updateMyProfile,
} = require("../services/userService");

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

const updateCurrentUser = asyncHandler(async (req, res) => {
  const profile = await updateMyProfile({
    userId: req.user._id,
    payload: req.body,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    data: profile,
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const missingCloudinaryKeys = getMissingCloudinaryEnvKeys();
  if (missingCloudinaryKeys.length) {
    throw new ApiError(
      500,
      `Cloudinary is not configured. Missing env vars: ${missingCloudinaryKeys.join(", ")}.`
    );
  }

  if (!req.file?.buffer) {
    throw new ApiError(400, "Please attach an image file in the 'avatar' field.");
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cylink/avatars",
        transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
      },
      (error, uploaded) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(uploaded);
      }
    );

    stream.end(req.file.buffer);
  });

  const profile = await updateMyProfile({
    userId: req.user._id,
    payload: { avatarUrl: result.secure_url },
  });

  res.status(200).json({
    success: true,
    message: "Avatar uploaded successfully.",
    data: profile,
  });
});

module.exports = {
  getMyProfile,
  getUserProfile,
  listUsers,
  updateCurrentUser,
  uploadAvatar,
};
