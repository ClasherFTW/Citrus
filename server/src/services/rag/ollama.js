const ApiError = require("../../utils/ApiError");

const getOllamaBaseUrl = () =>
  (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
const getOllamaModel = () => process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

const SYSTEM_PROMPT =
  "You are Citrus Bot. Give concise, correct, developer-friendly answers. Prefer practical steps and short examples when helpful.";

const createPrompt = ({ question, contextChunks = [] }) => {
  const contextText = contextChunks.length
    ? contextChunks
        .map((chunk, index) => `Context ${index + 1}:\n${String(chunk || "").trim()}`)
        .join("\n\n")
    : "No external context available.";

  return [`Question:\n${question}`, `Retrieved Context:\n${contextText}`].join("\n\n");
};

const createGeneratePayload = ({ question, contextChunks = [], stream }) => ({
  model: getOllamaModel(),
  system: SYSTEM_PROMPT,
  prompt: createPrompt({ question, contextChunks }),
  stream,
  options: {
    temperature: 0.2,
  },
});

const parseJsonLine = (line) => {
  try {
    return JSON.parse(line);
  } catch (_error) {
    return null;
  }
};

const requestGenerate = async ({ question, contextChunks = [], stream }) => {
  const response = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createGeneratePayload({ question, contextChunks, stream })),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      502,
      `Ollama request failed (${response.status}). ${
        errorText || "Check Ollama server and model availability."
      }`
    );
  }

  return response;
};

const generateAnswerWithOllama = async ({ question, contextChunks = [] }) => {
  const response = await requestGenerate({
    question,
    contextChunks,
    stream: false,
  });
  const payload = await response.json();

  return {
    answer: String(payload?.response || "").trim(),
    model: payload?.model || getOllamaModel(),
    contextUsed: contextChunks.length,
  };
};

const streamAnswerWithOllama = async ({
  question,
  contextChunks = [],
  onToken,
}) => {
  const response = await requestGenerate({
    question,
    contextChunks,
    stream: true,
  });

  if (!response.body) {
    throw new ApiError(502, "Ollama returned an empty stream body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  let model = getOllamaModel();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const parsed = parseJsonLine(trimmed);
      if (!parsed) return;

      if (parsed.model) {
        model = parsed.model;
      }

      const token = String(parsed.response || "");
      if (!token) return;

      fullAnswer += token;
      if (typeof onToken === "function") {
        onToken(token);
      }
    });
  }

  if (buffer.trim()) {
    const parsed = parseJsonLine(buffer.trim());
    if (parsed) {
      if (parsed.model) {
        model = parsed.model;
      }

      const token = String(parsed.response || "");
      if (token) {
        fullAnswer += token;
        if (typeof onToken === "function") {
          onToken(token);
        }
      }
    }
  }

  return {
    answer: fullAnswer.trim(),
    model,
    contextUsed: contextChunks.length,
  };
};

module.exports = {
  generateAnswerWithOllama,
  streamAnswerWithOllama,
  getOllamaModel,
};
