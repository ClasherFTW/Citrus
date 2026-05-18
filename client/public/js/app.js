const tokenKey = "cylink_token";
const bookmarkKey = "cylink_bookmarks";

const getToken = () => localStorage.getItem(tokenKey) || "";

const getBookmarks = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(bookmarkKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const setBookmarks = (items) => {
  localStorage.setItem(bookmarkKey, JSON.stringify(items));
};

const toggleBookmark = (questionId) => {
  const current = getBookmarks();
  const has = current.includes(questionId);
  const next = has ? current.filter((id) => id !== questionId) : [...current, questionId];
  setBookmarks(next);
  return !has;
};

const clearLocalSession = () => {
  localStorage.removeItem(tokenKey);
};

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

const handleUnauthorized = (error) => {
  if (error?.status === 401) {
    clearLocalSession();
    window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return true;
  }

  return false;
};

const logoutBtn = document.querySelector("#logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/auth/session", { method: "DELETE", credentials: "include" });
    } finally {
      clearLocalSession();
      window.location.href = "/auth";
    }
  });
}

const saveButtons = document.querySelectorAll(".js-toggle-save");
if (saveButtons.length > 0) {
  const bookmarks = getBookmarks();

  saveButtons.forEach((button) => {
    const questionId = button.dataset.id;
    button.textContent = bookmarks.includes(questionId) ? "Saved" : "Save";
    button.addEventListener("click", () => {
      const nowSaved = toggleBookmark(questionId);
      button.textContent = nowSaved ? "Saved" : "Save";

      const params = new URLSearchParams(window.location.search);
      if (params.get("saved") === "1" && !nowSaved) {
        const row = button.closest(".question-item");
        if (row) row.remove();
      }
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("saved") === "1") {
    const rows = document.querySelectorAll(".question-item[data-question-id]");
    rows.forEach((row) => {
      if (!bookmarks.includes(row.dataset.questionId)) {
        row.remove();
      }
    });
  }
}

const askForm = document.querySelector("#askForm");
if (askForm) {
  askForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#askMessage");
    const formData = new FormData(askForm);

    try {
      await apiFetch("/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          tags: String(formData.get("tags") || ""),
        }),
      });

      message.textContent = "Question posted. Refreshing...";
      window.location.reload();
    } catch (error) {
      if (!handleUnauthorized(error)) {
        message.textContent = error.message;
      }
    }
  });
}

const answerForm = document.querySelector("#answerForm");
if (answerForm) {
  answerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#answerMessage");
    const formData = new FormData(answerForm);

    try {
      await apiFetch("/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: answerForm.dataset.questionId,
          content: formData.get("content"),
        }),
      });

      message.textContent = "Answer submitted. Refreshing...";
      window.location.reload();
    } catch (error) {
      if (!handleUnauthorized(error)) {
        message.textContent = error.message;
      }
    }
  });
}

const questionVoteButtons = document.querySelectorAll(".js-vote-question");
questionVoteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await apiFetch(`/questions/${button.dataset.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: button.dataset.vote }),
      });
      window.location.reload();
    } catch (error) {
      if (!handleUnauthorized(error)) {
        alert(error.message);
      }
    }
  });
});

const answerVoteButtons = document.querySelectorAll(".js-vote-answer");
answerVoteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await apiFetch(`/answers/${button.dataset.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: button.dataset.vote }),
      });
      window.location.reload();
    } catch (error) {
      if (!handleUnauthorized(error)) {
        alert(error.message);
      }
    }
  });
});

const profileForm = document.querySelector("#profileForm");
if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const profileMessage = document.querySelector("#profileMessage");
    const formData = new FormData(profileForm);

    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          bio: formData.get("bio"),
        }),
      });

      profileMessage.textContent = "Profile updated.";
    } catch (error) {
      if (!handleUnauthorized(error)) {
        profileMessage.textContent = error.message;
      }
    }
  });
}

const avatarForm = document.querySelector("#avatarForm");
if (avatarForm) {
  avatarForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const profileMessage = document.querySelector("#profileMessage");
    const avatarPreview = document.querySelector("#avatarPreview");

    try {
      const formData = new FormData(avatarForm);
      const response = await apiFetch("/users/me/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.data?.avatarUrl) {
        avatarPreview.src = response.data.avatarUrl;
        avatarPreview.hidden = false;
      }

      profileMessage.textContent = "Avatar uploaded successfully.";
    } catch (error) {
      if (!handleUnauthorized(error)) {
        profileMessage.textContent = error.message;
      }
    }
  });
}
