import { useEffect, useMemo, useRef, useState } from "react";
import { askCitrusBotStream } from "../../features/ai/aiApi";

const STORAGE_KEY = "citrus_bot_threads";

function getThread(questionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return Array.isArray(parsed[questionId]) ? parsed[questionId] : null;
  } catch (_error) {
    return null;
  }
}

function saveThread(questionId, messages) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...(typeof parsed === "object" && parsed ? parsed : {}),
        [questionId]: messages,
      })
    );
  } catch (_error) {
    // Ignore storage errors.
  }
}

function createMessage(role, content, extras = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    ...extras,
  };
}

function getDefaultThread() {
  return [
    createMessage(
      "assistant",
      "I am Citrus Bot. Ask Citrus anything about this question."
    ),
  ];
}

function normalizeThread(thread) {
  if (!Array.isArray(thread) || thread.length === 0) {
    return getDefaultThread();
  }

  return thread.map((message, index) => ({
    id: message?.id || `thread-message-${index}`,
    role: message?.role || "assistant",
    content: String(message?.content || ""),
    isStreaming: false,
  }));
}

function CitrusBotPanel({ questionId, post, selectedContext, onClearContext }) {
  const [isOpen, setIsOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState(() => normalizeThread(getThread(questionId)));
  const endRef = useRef(null);
  const activeRequestRef = useRef(null);

  useEffect(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
    }

    setMessages(normalizeThread(getThread(questionId)));
  }, [questionId]);

  useEffect(() => {
    saveThread(questionId, messages);
  }, [questionId, messages]);

  useEffect(
    () => () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
    },
    []
  );

  const postContext = useMemo(() => {
    if (!post) return "";

    return [
      `Question title: ${post.title}`,
      `Question description: ${post.description}`,
      `Tags: ${(post.tags || []).join(", ")}`,
    ].join("\n");
  }, [post]);

  async function handleSubmit(event) {
    event.preventDefault();

    const prompt = draft.trim();
    if (!prompt || isLoading) return;

    setError("");
    setIsLoading(true);
    setDraft("");

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setMessages((prev) => [
      ...prev,
      createMessage("user", prompt),
      createMessage("assistant", "", {
        id: assistantMessageId,
        isStreaming: true,
      }),
    ]);

    try {
      const payload = [
        "Citrus context:",
        postContext,
        selectedContext ? `Selected answer context:\n${selectedContext}` : "",
        `User prompt: ${prompt}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const abortController = new AbortController();
      activeRequestRef.current = abortController;

      const data = await askCitrusBotStream({
        question: payload,
        useRetrieval: true,
        signal: abortController.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: `${message.content}${chunk}`,
                    isStreaming: true,
                  }
                : message
            )
          );

          window.requestAnimationFrame(() => {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
          });
        },
      });

      setMessages((prev) => [
        ...prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: message.content.trim()
                  ? message.content
                  : data.answer || "No response returned.",
                isStreaming: false,
              }
            : message
        ),
      ]);
    } catch (requestError) {
      const isAborted = requestError?.name === "AbortError";
      const errorMessage = isAborted
        ? "Citrus Bot request was cancelled."
        : requestError.message || "Could not reach Citrus Bot.";

      setError(errorMessage);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: isAborted
                  ? "Streaming stopped."
                  : "I could not generate an answer right now. Please try again.",
                isStreaming: false,
              }
            : message
        )
      );
    } finally {
      activeRequestRef.current = null;
      setIsLoading(false);
      window.requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  function clearThread() {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
    }

    setMessages([
      createMessage(
        "assistant",
        "Thread reset. Ask a fresh question whenever you want."
      ),
    ]);
  }

  return (
    <aside className="bot-widget">
      <button type="button" className="bot-widget__trigger" onClick={() => setIsOpen((prev) => !prev)}>
        <span>Citrus Bot</span>
        <span className="ask-tag">ask citrus</span>
      </button>

      {isOpen ? (
        <div className="bot-widget__panel">
          <div className="bot-widget__panel-head">
            {selectedContext ? (
              <p>
                Using selected answer context.
                <button type="button" className="text-button" onClick={onClearContext}>
                  Clear
                </button>
              </p>
            ) : (
              <p>No answer context selected.</p>
            )}
            <button type="button" className="soft-action" onClick={clearThread}>
              Reset
            </button>
          </div>

          <div className="bot-widget__messages">
            {messages.map((msg, index) => (
              <p
                key={msg.id || `${msg.role}-${index}`}
                className={`chat-bubble chat-bubble--${msg.role} ${
                  msg.isStreaming ? "chat-bubble--streaming" : ""
                }`}
              >
                {msg.content}
                {msg.isStreaming ? <span className="chat-caret" aria-hidden="true" /> : null}
              </p>
            ))}
            <div ref={endRef} />
          </div>

          <form className="bot-widget__form" onSubmit={handleSubmit}>
            <textarea
              rows={3}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Citrus about this issue"
              required
            />

            {error ? <p className="inline-error">{error}</p> : null}

            <button type="submit" className="btn btn--primary" disabled={isLoading}>
              {isLoading ? "Generating..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </aside>
  );
}

export default CitrusBotPanel;
