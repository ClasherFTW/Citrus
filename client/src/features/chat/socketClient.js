import { io } from "socket.io-client";
import { getApiBaseUrl } from "../../lib/config";

const API_BASE_URL = getApiBaseUrl();
let socket = null;

export function getSocket(token) {
  if (!token) return null;

  if (socket && socket.connected) {
    return socket;
  }

  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: {
        token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
