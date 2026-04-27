const express = require("express");
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateMiddleware");
const { chatValidators } = require("../utils/validators");

const router = express.Router();

// Router-level middleware for private chat endpoints.
router.use(protect);

router.get("/", chatController.listChats);
router.post("/start", chatValidators.startChat, validateRequest, chatController.startChat);
router.get(
  "/:chatId/messages",
  chatValidators.getMessages,
  validateRequest,
  chatController.listMessages
);
router.post(
  "/:chatId/messages",
  chatValidators.sendMessage,
  validateRequest,
  chatController.postMessage
);

module.exports = router;
