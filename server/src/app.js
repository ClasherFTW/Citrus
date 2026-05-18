const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const { buildCorsOriginDelegate } = require("./config/cors");
const { getMissingCloudinaryEnvKeys } = require("./config/cloudinary");

const loggerMiddleware = require("./middleware/loggerMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const webRoutes = require("./routes/webRoutes");
const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require("./routes/aiRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const missingCloudinaryKeys = getMissingCloudinaryEnvKeys();
if (missingCloudinaryKeys.length) {
  // eslint-disable-next-line no-console
  console.warn(`[Cloudinary] Missing env vars: ${missingCloudinaryKeys.join(", ")}`);
}

app.set("view engine", "ejs");
app.set("views", path.join(PROJECT_ROOT, "client", "views"));

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: buildCorsOriginDelegate(),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loggerMiddleware);
app.use(express.static(path.join(PROJECT_ROOT, "client", "public")));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CyLink backend is healthy.",
    timestamp: new Date().toISOString(),
  });
});

app.use("/", webRoutes);
app.use("/auth", authRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/users", userRoutes);
app.use("/ai", aiRoutes);
app.use("/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
