const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new ApiError(400, "Validation failed.", {
      errors: errors.array(),
    })
  );
};

module.exports = validateRequest;
