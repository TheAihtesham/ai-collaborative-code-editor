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

    socket.on("ai-request", async ({ prompt, currentCode, language }) => {
      let aiResponse = "I am sorry, I couldn't process";

      try {
        let chatHistory = [];
        let fullPrompt = prompt;

        if (!currentCode || currentCode.trim() === "") {
          aiResponse = "Please provide code to explain.";
        } else {
          fullPrompt += `\n\nThis code is written in ${language}. Please explain the code:\n${currentCode}`;
        }

        chatHistory.push({ role: 'user', parts: [{ text: fullPrompt }] });
        const payload = { contents: chatHistory };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API}`;
       
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();

        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiText) {
          aiResponse = aiText;
        } else {
          aiResponse = "No valid response from AI.";
        }

      } catch (error) {
        aiResponse = `Error contacting AI: ${error.message}`;
      } finally {
        socket.emit("ai-response", { response: aiResponse });
      }
    })
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
