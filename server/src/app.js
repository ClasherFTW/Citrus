const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");

const loggerMiddleware = require("./middleware/loggerMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require("./routes/aiRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return true;

  const origins = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (origins.length === 0) return true;
  if (origins.includes("*")) return true;
  return origins;
};

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: parseAllowedOrigins(),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Citrus backend is healthy.",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/users", userRoutes);
app.use("/ai", aiRoutes);
app.use("/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
