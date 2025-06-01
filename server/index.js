const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const apiRoutes = require('./routes/apiRoutes')

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
app.use('/api', apiRoutes)

const rooms = {};
const socketToRoom = {};
const roomCode = {};

io.on("connection", (socket) => {

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    if (!rooms[roomId]) rooms[roomId] = [];

    const alreadyInRoom = rooms[roomId].some((user) => user.userId === socket.id);
    if (!alreadyInRoom) {
      rooms[roomId].push({ userId: socket.id, username });
    }

    console.log(`[SERVER] User ${username} (${socket.id}) joined room ${roomId}. Current users in room:`, rooms[roomId].map(u => u.username)); // DEBUG: Log user joining

    // Notify all in room that a new user joined
    io.to(roomId).emit("user-joined", {
      users: rooms[roomId],
      message: `${username} joined the room.`,
      userId: socket.id,
    });

    const existingCode = roomCode[roomId] || " ";
    socket.emit('load-code', existingCode);

    socket.on("code-change", ({ roomId, code }) => {
      roomCode[roomId] = code
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
        console.log(`[SERVER] User ${user.username} (${socket.id}) left room ${roomId}. Remaining users:`, rooms[roomId].map(u => u.username)); // DEBUG: Log user leaving
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
