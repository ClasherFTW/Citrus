(function () {
  const tokenKey = "cylink_token";
  const bootstrap = window.__CYLINK_CHAT_BOOTSTRAP__ || {
    initialParticipant: "",
    initialChats: [],
    selfId: "",
  };

  const getToken = () => localStorage.getItem(tokenKey) || "";

  const apiFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || "Request failed");
      error.status = response.status;
      throw error;
    }

    return data;
  };

  const threadEl = document.querySelector("#chatThread");
  const listEl = document.querySelector("#chatList");
  const chatCountEl = document.querySelector("#chatCount");
  const partnerNameEl = document.querySelector("#chatPartnerName");
  const partnerMetaEl = document.querySelector("#chatPartnerMeta");
  const typingStateEl = document.querySelector("#chatTypingState");
  const messageForm = document.querySelector("#chatMessageForm");
  const draftInput = document.querySelector("#chatDraftInput");
  const sendBtn = document.querySelector("#chatSendBtn");
  const startForm = document.querySelector("#chatStartForm");
  const participantIdInput = document.querySelector("#participantIdInput");
  const participantSearchInput = document.querySelector("#participantSearchInput");
  const searchResultsEl = document.querySelector("#chatUserSearchResults");

  let chats = Array.isArray(bootstrap.initialChats) ? bootstrap.initialChats : [];
  let activeChatId = chats[0]?._id || "";
  let messages = [];
  let typingTimeout = null;
  let socket = null;

  const startChatByParticipant = async (participantId) => {
    const result = await apiFetch("/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId }),
    });

    activeChatId = result.data?._id || activeChatId;
    await Promise.all([refreshChats(), loadMessages()]);
    joinActiveRoom();
  };

  const resolveOtherParticipant = (chat) => {
    const users = chat?.participants || [];
    return users.find((user) => String(user?._id || user?.id || user) !== String(bootstrap.selfId)) || users[0] || null;
  };

  const renderChats = () => {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!chats.length) {
      listEl.innerHTML = '<p class="muted">No chats yet. Search and start one above.</p>';
      chatCountEl.textContent = "0";
      return;
    }

    chatCountEl.textContent = String(chats.length);

    chats.forEach((chat) => {
      const partner = resolveOtherParticipant(chat);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chat-list-item ${chat._id === activeChatId ? "is-active" : ""}`;
      btn.innerHTML = `<strong>${partner?.username || "Unknown user"}</strong><small>${chat.lastMessage?.content || "No messages yet"}</small>`;
      btn.addEventListener("click", async () => {
        activeChatId = chat._id;
        renderChats();
        await loadMessages();
        joinActiveRoom();
      });
      listEl.appendChild(btn);
    });
  };

  const renderMessages = () => {
    if (!threadEl) return;
    threadEl.innerHTML = "";

    if (!activeChatId) {
      threadEl.innerHTML = '<p class="muted">Start a chat to begin messaging.</p>';
      draftInput.disabled = true;
      sendBtn.disabled = true;
      return;
    }

    const activeChat = chats.find((chat) => chat._id === activeChatId);
    const partner = resolveOtherParticipant(activeChat);
    partnerNameEl.textContent = partner?.username || "Messages";
    partnerMetaEl.textContent = partner?.email || "";

    draftInput.disabled = false;
    sendBtn.disabled = false;

    messages.forEach((message) => {
      const mine = String(message.senderId?._id || message.senderId) === String(bootstrap.selfId);
      const item = document.createElement("article");
      item.className = `chat-msg ${mine ? "mine" : "theirs"}`;
      item.innerHTML = `<p>${message.content}</p><small>${new Date(message.createdAt).toLocaleString()}</small>`;
      threadEl.appendChild(item);
    });

    threadEl.scrollTop = threadEl.scrollHeight;
  };

  const refreshChats = async () => {
    const result = await apiFetch("/chat?page=1&limit=30");
    chats = result.data?.items || [];
    if (!activeChatId && chats.length > 0) {
      activeChatId = chats[0]._id;
    }
    renderChats();
  };

  const loadMessages = async () => {
    if (!activeChatId) {
      messages = [];
      renderMessages();
      return;
    }

    const result = await apiFetch(`/chat/${activeChatId}/messages?page=1&limit=100`);
    messages = result.data?.items || [];
    renderMessages();
  };

  const joinActiveRoom = () => {
    if (!socket || !activeChatId) return;
    socket.emit("joinRoom", { chatId: activeChatId });
  };

  const connectSocket = () => {
    const token = getToken();
    if (!window.io || !token) return;

    socket = window.io({ auth: { token } });

    socket.on("receiveMessage", (message) => {
      if (message.chatId !== activeChatId) {
        refreshChats().catch(() => {});
        return;
      }

      if (!messages.some((item) => item._id === message._id)) {
        messages.push(message);
        renderMessages();
      }
      refreshChats().catch(() => {});
    });

    socket.on("typing", (payload) => {
      if (payload.chatId !== activeChatId || payload.userId === bootstrap.selfId) return;
      typingStateEl.textContent = payload.isTyping ? "Other user is typing..." : "";
    });

    joinActiveRoom();
  };

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = (draftInput.value || "").trim();
    if (!content || !activeChatId) return;

    draftInput.value = "";
    typingStateEl.textContent = "";

    try {
      if (socket) {
        socket.emit("sendMessage", { chatId: activeChatId, content }, async (ack) => {
          if (!ack?.success) {
            await apiFetch(`/chat/${activeChatId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content }),
            });
          }
          await Promise.all([refreshChats(), loadMessages()]);
        });
      } else {
        await apiFetch(`/chat/${activeChatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        await Promise.all([refreshChats(), loadMessages()]);
      }
    } catch (error) {
      alert(error.message || "Failed to send message");
    }
  });

  draftInput?.addEventListener("input", () => {
    if (!socket || !activeChatId) return;
    socket.emit("typing", { chatId: activeChatId, isTyping: draftInput.value.length > 0 });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("typing", { chatId: activeChatId, isTyping: false });
    }, 900);
  });

  startForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const participantId = (participantIdInput.value || "").trim();
    if (!participantId) return;

    try {
      await startChatByParticipant(participantId);
    } catch (error) {
      alert(error.message || "Could not start chat");
    }
  });

  participantSearchInput?.addEventListener("input", async () => {
    const value = participantSearchInput.value.trim();
    searchResultsEl.innerHTML = "";

    if (value.length < 2) return;

    try {
      const result = await apiFetch(`/users?search=${encodeURIComponent(value)}&page=1&limit=8`);
      const rows = result.data?.items || [];

      if (!rows.length) {
        searchResultsEl.innerHTML = '<p class="muted">No users found.</p>';
        return;
      }

      rows.forEach((candidate) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-list-item chat-user-result";
        btn.innerHTML = `<strong>${candidate.username}</strong><small>${candidate.email}</small>`;
        btn.addEventListener("click", async () => {
          participantIdInput.value = candidate.id;
          await startChatByParticipant(candidate.id);
        });
        searchResultsEl.appendChild(btn);
      });
    } catch (_error) {
      searchResultsEl.innerHTML = '<p class="inline-error">Unable to search users.</p>';
    }
  });

  const boot = async () => {
    try {
      await refreshChats();

      if (bootstrap.initialParticipant) {
        participantIdInput.value = bootstrap.initialParticipant;
        await startChatByParticipant(bootstrap.initialParticipant);
      } else {
        await loadMessages();
      }

      connectSocket();
      setInterval(() => {
        refreshChats().catch(() => {});
        loadMessages().catch(() => {});
      }, 10000);
    } catch (_error) {
      renderChats();
      renderMessages();
    }
  };

  renderChats();
  renderMessages();
  boot();
})();
