import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = localStorage.getItem("token");
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
