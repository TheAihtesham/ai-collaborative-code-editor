const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const rooms = {}; 
const socketToRoom = {}; 

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    if (!rooms[roomId]) rooms[roomId] = [];

    const alreadyInRoom = rooms[roomId].some((user) => user.userId === socket.id);
    if (!alreadyInRoom) {
      rooms[roomId].push({ userId: socket.id, username });
    }

    // Notify all in room that a new user joined
    io.to(roomId).emit("user-joined", {
      users: rooms[roomId],
      message: `${username} joined the room.`,
      userId: socket.id,
    });
    
    socket.on("code-change", ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", { code });
    });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];

    if (roomId && rooms[roomId]) {
      const user = rooms[roomId].find((user) => user.userId === socket.id);
      rooms[roomId] = rooms[roomId].filter((user) => user.userId !== socket.id);

      if (user) {
        // Notify all in room that a user left
        io.to(roomId).emit("user-left", {
          users: rooms[roomId],
          message: `${user.username} left the room.`,
          userId: socket.id,
        });
      }

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }

    delete socketToRoom[socket.id];
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
