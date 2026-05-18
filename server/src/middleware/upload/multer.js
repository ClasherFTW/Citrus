const multer = require("multer");
const ApiError = require("../../utils/ApiError");

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new ApiError(400, "Only image uploads are allowed (jpeg, png, webp, gif, etc.)."));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = {
  upload,
};
