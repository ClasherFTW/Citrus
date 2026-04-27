require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initializeSocket = require("./sockets");

const PORT = Number(process.env.PORT) || 5000;
let server = null;

const startServer = async () => {
  await connectDB();

  server = http.createServer(app);
  const io = initializeSocket(server);
  app.set("io", io);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Citrus backend running on port ${PORT}`);
  });
};

const gracefulShutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error("Force shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled Promise Rejection:", error);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

startServer();
