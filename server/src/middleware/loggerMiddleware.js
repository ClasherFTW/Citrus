const morgan = require("morgan");

const loggerMiddleware =
  process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev");

module.exports = loggerMiddleware;
