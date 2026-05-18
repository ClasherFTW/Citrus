const multer = require("multer");
const ApiError = require("../utils/ApiError");

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image is too large. Max upload size is 5MB.";
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Schema validation failed.";
    details = Object.values(err.errors).map((item) => item.message);
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate resource already exists.";
    details = err.keyValue;
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
