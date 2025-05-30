"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert("Please enter your username to create a room.");
      return;
    }
    const newRoomId = uuidv4();
    router.push(`/room/${newRoomId}?username=${encodeURIComponent(username.trim())}`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim() || !username.trim()) {
      alert("Please enter both Room ID and your Username.");
      return;
    }
    router.push(`/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`);
  };

  return (
    <main className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-90 z-0"></div>
      <nav className="relative z-10 w-full flex justify-between items-center px-6 md:px-12 py-2 shadow-lg bg-gray-900 bg-opacity-70 backdrop-blur-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text drop-shadow-md">
          CodeMate 🚀
        </h1>
      </nav>

      <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col lg:flex-row items-center justify-center lg:justify-around p-6 md:p-12 gap-12">
        <div className="w-full lg:w-[45%] text-center lg:text-left">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 mt-9 sm:mt-0 drop-shadow-lg">
            Code Together, <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">Instantly.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl mx-auto lg:mx-0">
            Collaborate on code in real-time. No setup, no downloads, just seamless shared editing in your browser.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 shadow-2xl rounded-xl p-7 md:p-10 w-full max-w-md space-y-6 text-center transform hover:scale-[1.02] transition-all duration-300">
          <h2 className="text-3xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-blue-500 text-transparent bg-clip-text">
            Join or Create a Room
          </h2>
          <p className="text-gray-400 text-md">Start collaborating in seconds!</p>

          <input
            type="text"
            placeholder="Your Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-5 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            required
          />

          <div className="flex items-center space-x-3 text-gray-400">
            <hr className="flex-grow border-gray-700" />
            <span>OR</span>
            <hr className="flex-grow border-gray-700" />
          </div>

          <input
            type="text"
            placeholder="Enter Existing Room ID (optional)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-5 py-3 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
          />

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button
              onClick={handleCreateRoom}
              className="w-full md:w-auto flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Create New Room
            </button>
            <button
              onClick={handleJoinRoom}
              className="w-full md:w-auto flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Join Room
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-4">Room IDs are automatically generated for new rooms. </p>
        </div>
      </div>

      <footer className="relative z-10 w-full py-8 text-center text-gray-500 text-sm border-t border-gray-800 mt-10">
        <p>&copy; {new Date().getFullYear()} CodeMate. All rights reserved.</p>
        <p className="mt-2">
          Built with ❤️ using <a href="https://socket.io/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Socket.IO</a> &amp; <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Next.js</a>
        </p>
      </footer>
    </main>
  );
}