import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

let socketInstance = null;

export const getSocket = () => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Real-time Socket connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });
  } else if (token && !socketInstance.auth?.token) {
    socketInstance.auth = { token };
    socketInstance.connect();
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

// Safe socket proxy that works with direct import like `socket.on(...)` or `socket.emit(...)`
const socket = {
  connect: () => {
    const s = getSocket();
    if (s && !s.connected) s.connect();
    return s;
  },
  disconnect: () => {
    disconnectSocket();
  },
  on: (event, callback) => {
    const s = getSocket();
    if (s) s.on(event, callback);
    return socket;
  },
  off: (event, callback) => {
    const s = getSocket();
    if (s) s.off(event, callback);
    return socket;
  },
  emit: (event, ...args) => {
    const s = getSocket();
    if (s) s.emit(event, ...args);
    return socket;
  },
};

export default socket;
