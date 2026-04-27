const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getPagination, toObjectIdString } = require("../utils/helpers");

const getUserRoom = (userId) => `user:${toObjectIdString(userId)}`;
const getChatRoom = (chatId) => `chat:${toObjectIdString(chatId)}`;

const buildParticipantHash = (firstUserId, secondUserId) =>
  [toObjectIdString(firstUserId), toObjectIdString(secondUserId)].sort().join(":");

const isChatParticipant = (chat, userId) =>
  chat.participants.some(
    (participantId) => toObjectIdString(participantId) === toObjectIdString(userId)
  );

const resolveReceiverId = (chat, senderId) => {
  const receiver = chat.participants.find(
    (participantId) => toObjectIdString(participantId) !== toObjectIdString(senderId)
  );
  return receiver ? toObjectIdString(receiver) : null;
};

const startOrGetChat = async ({ userId, participantId }) => {
  if (toObjectIdString(userId) === toObjectIdString(participantId)) {
    throw new ApiError(400, "Cannot start chat with yourself.");
  }

  const participantExists = await User.exists({ _id: participantId });
  if (!participantExists) {
    throw new ApiError(404, "Target participant does not exist.");
  }

  const participantHash = buildParticipantHash(userId, participantId);

  let chat = await Chat.findOne({ participantHash })
    .populate("participants", "username reputation role avatarUrl")
    .populate({
      path: "lastMessage",
      populate: { path: "senderId receiverId", select: "username avatarUrl" },
    });

  if (!chat) {
    try {
      chat = await Chat.create({
        participants: [userId, participantId],
        participantHash,
      });

      chat = await Chat.findById(chat._id)
        .populate("participants", "username reputation role avatarUrl")
        .populate({
          path: "lastMessage",
          populate: { path: "senderId receiverId", select: "username avatarUrl" },
        });
    } catch (error) {
      if (error.code === 11000) {
        chat = await Chat.findOne({ participantHash })
          .populate("participants", "username reputation role avatarUrl")
          .populate({
            path: "lastMessage",
            populate: { path: "senderId receiverId", select: "username avatarUrl" },
          });
      } else {
        throw error;
      }
    }
  }

  return chat;
};

const listChatsForUser = async ({ userId, page, limit }) => {
  const { skip, page: safePage, limit: safeLimit } = getPagination({ page, limit });

  const [rows, total] = await Promise.all([
    Chat.find({ participants: userId })
      .populate("participants", "username reputation role avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "senderId receiverId", select: "username avatarUrl" },
      })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Chat.countDocuments({ participants: userId }),
  ]);

  return {
    items: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const getChatMessages = async ({ chatId, userId, page, limit }) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  if (!isChatParticipant(chat, userId)) {
    throw new ApiError(403, "You are not a participant in this chat.");
  }

  const { skip, page: safePage, limit: safeLimit } = getPagination({ page, limit });

  const [rows, total] = await Promise.all([
    Message.find({ chatId })
      .populate("senderId", "username avatarUrl")
      .populate("receiverId", "username avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Message.countDocuments({ chatId }),
  ]);

  return {
    items: rows.reverse(),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const sendMessage = async ({
  senderId,
  chatId = null,
  receiverId = null,
  content,
}) => {
  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) {
    throw new ApiError(400, "Message content is required.");
  }

  let chat = null;

  if (chatId) {
    chat = await Chat.findById(chatId);
    if (!chat) {
      throw new ApiError(404, "Chat not found.");
    }

    if (!isChatParticipant(chat, senderId)) {
      throw new ApiError(403, "You are not a participant in this chat.");
    }

    if (!receiverId) {
      receiverId = resolveReceiverId(chat, senderId);
    }
  } else {
    if (!receiverId) {
      throw new ApiError(400, "receiverId is required when chatId is not provided.");
    }
    chat = await startOrGetChat({ userId: senderId, participantId: receiverId });
  }

  const message = await Message.create({
    chatId: chat._id,
    senderId,
    receiverId,
    content: normalizedContent,
  });

  chat.lastMessage = message._id;
  chat.lastMessageAt = new Date();
  await chat.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("senderId", "username avatarUrl")
    .populate("receiverId", "username avatarUrl");

  const populatedChat = await Chat.findById(chat._id)
    .populate("participants", "username reputation role avatarUrl")
    .populate({
      path: "lastMessage",
      populate: { path: "senderId receiverId", select: "username avatarUrl" },
    });

  return {
    chat: populatedChat,
    message: populatedMessage,
    receiverId: toObjectIdString(receiverId),
  };
};

module.exports = {
  getUserRoom,
  getChatRoom,
  startOrGetChat,
  listChatsForUser,
  getChatMessages,
  sendMessage,
};
