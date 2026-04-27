const {
  sendMessage,
  getChatRoom,
  getUserRoom,
} = require("../services/chatService");

const registerChatSocketHandlers = (io, socket) => {
  socket.on("joinRoom", ({ chatId } = {}, ack) => {
    if (!chatId) {
      if (typeof ack === "function") {
        ack({ success: false, message: "chatId is required." });
      }
      return;
    }

    socket.join(getChatRoom(chatId));
    if (typeof ack === "function") {
      ack({ success: true, chatId });
    }
  });

  socket.on("leaveRoom", ({ chatId } = {}, ack) => {
    if (!chatId) {
      if (typeof ack === "function") {
        ack({ success: false, message: "chatId is required." });
      }
      return;
    }

    socket.leave(getChatRoom(chatId));
    if (typeof ack === "function") {
      ack({ success: true, chatId });
    }
  });

  socket.on("typing", ({ chatId, isTyping = true } = {}) => {
    if (!chatId) return;
    socket.to(getChatRoom(chatId)).emit("typing", {
      chatId,
      userId: socket.user.id,
      isTyping,
    });
  });

  socket.on(
    "sendMessage",
    async ({ chatId = null, receiverId = null, content } = {}, ack) => {
      try {
        const payload = await sendMessage({
          senderId: socket.user.id,
          chatId,
          receiverId,
          content,
        });

        const room = getChatRoom(payload.chat._id);
        socket.join(room);
        io.to(room).emit("receiveMessage", payload.message);
        io.to(getUserRoom(payload.receiverId)).emit("receiveMessage", payload.message);

        if (typeof ack === "function") {
          ack({
            success: true,
            data: payload,
          });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({
            success: false,
            message: error.message || "Unable to send message.",
          });
        }
      }
    }
  );

  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log(`Socket disconnected: ${socket.id}`);
  });
};

module.exports = registerChatSocketHandlers;
