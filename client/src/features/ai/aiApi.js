import { apiRequest, ApiClientError } from "../../lib/apiClient";
import { getStoredToken } from "../../lib/session";
import { getApiBaseUrl } from "../../lib/config";

export function askCitrusBot({ question, useRetrieval = true }) {
  return apiRequest("/ai/chat", {
    method: "POST",
    body: {
      question,
      useRetrieval,
    },
  });
}

export async function askCitrusBotStream({
  question,
  useRetrieval = true,
  onChunk,
  signal,
}) {
  const token = getStoredToken();
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/ai/chat/stream`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      question,
      useRetrieval,
    }),
    signal,
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }

    throw new ApiClientError(payload?.message || "Request failed.", {
      status: response.status,
      details: payload?.details || null,
    });
  }

  if (!response.body) {
    throw new ApiClientError("Streaming response body is unavailable.", {
      status: 502,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) continue;

    fullText += chunk;
    if (typeof onChunk === "function") {
      onChunk(chunk, fullText);
    }
  }

  return {
    answer: fullText.trim(),
  };
}
