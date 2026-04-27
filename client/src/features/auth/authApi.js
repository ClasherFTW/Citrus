import { apiRequest } from "../../lib/apiClient";

const buildAuthHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;

export function syncFirebaseProfile(payload = {}, token) {
  return apiRequest("/auth/sync", {
    method: "POST",
    body: payload,
    headers: buildAuthHeaders(token),
  });
}

export function getCurrentUser(token) {
  return apiRequest("/auth/me", {
    headers: buildAuthHeaders(token),
  });
}

export function logoutUser(token) {
  return apiRequest("/auth/logout", {
    method: "POST",
    headers: buildAuthHeaders(token),
  });
}
