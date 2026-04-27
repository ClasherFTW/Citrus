const asyncHandler = require("../utils/asyncHandler");
const {
  startOrGetChat,
  listChatsForUser,
  getChatMessages,
  sendMessage,
  getChatRoom,
  getUserRoom,
} = require("../services/chatService");

const startChat = asyncHandler(async (req, res) => {
  const chat = await startOrGetChat({
    userId: req.user._id,
    participantId: req.body.participantId,
  });

  res.status(201).json({
    success: true,
    message: "Chat ready.",
    data: chat,
  });
});

const listChats = asyncHandler(async (req, res) => {
  const result = await listChatsForUser({
    userId: req.user._id,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const listMessages = asyncHandler(async (req, res) => {
  const result = await getChatMessages({
    chatId: req.params.chatId,
    userId: req.user._id,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const postMessage = asyncHandler(async (req, res) => {
  const payload = await sendMessage({
    senderId: req.user._id,
    chatId: req.params.chatId,
    content: req.body.content,
  });

  const io = req.app.get("io");
  if (io) {
    io.to(getChatRoom(payload.chat._id)).emit("receiveMessage", payload.message);
    io.to(getUserRoom(payload.receiverId)).emit("receiveMessage", payload.message);
  }

  res.status(201).json({
    success: true,
    message: "Message sent.",
    data: payload,
  });
});

module.exports = {
  startChat,
  listChats,
  listMessages,
  postMessage,
};
