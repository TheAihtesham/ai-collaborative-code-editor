import { io } from "socket.io-client";

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io("https://codemate-4fyl.onrender.com", {
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


