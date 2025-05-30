import { io } from "socket.io-client";

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io("http://localhost:8000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected (from initSocket):", reason);
    });
  }
  return socket;
};


