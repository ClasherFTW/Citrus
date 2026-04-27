import { getStoredToken } from "./session";
import { getApiBaseUrl } from "./config";

const API_BASE_URL = getApiBaseUrl();

export class ApiClientError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers = {
    ...(customHeaders || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = body instanceof FormData;
  if (!isFormData && body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...restOptions,
    headers,
    body: isFormData || body === undefined ? body : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiClientError(payload?.message || "Request failed.", {
      status: response.status,
      details: payload?.details || null,
    });
  }

  return payload?.data;
}
