import { apiRequest } from "../../lib/apiClient";

export function getMyProfile() {
  return apiRequest("/users/me");
}

export function getUserProfile(userId) {
  return apiRequest(`/users/${userId}`);
}

export function listUsers({ search = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const query = params.toString();
  return apiRequest(`/users${query ? `?${query}` : ""}`);
}
