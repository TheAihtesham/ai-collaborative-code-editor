// components/Sidebar.jsx
import React from 'react';
import { toast } from 'react-toastify'; // Import toast for consistency

export function SidebarControls({
  language,
  setLanguage,
  theme,
  setTheme,
  users,
  isRunning,
  runCode,
  copyRoomId,
  sidebarOpen,
  setSidebarOpen,
  username, 
}) {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:static md:flex-shrink-0"}`}
    >
      <div className="flex flex-col h-full p-4">
        {/* Close button on mobile */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h2 className="text-xl font-semibold text-center flex-grow">Controls</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          onClick={copyRoomId}
          className="mb-6 bg-blue-600 hover:bg-blue-700 rounded px-4 py-2 font-semibold"
        >
          Copy Room ID
        </button>

        <label htmlFor="language-select" className="mb-2 font-medium">Language</label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mb-6 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>

        <label htmlFor="theme-select" className="mb-2 font-medium">Theme</label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="mb-6 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        >
          <option value="vs-dark">Dark</option>
          <option value="light">Light</option>
        </select>

        <button
          onClick={runCode}
          disabled={isRunning}
          className={`mt-auto px-6 py-3 rounded font-bold ${isRunning ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"}`}
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md text-sm text-gray-300 max-w-xs">
          <p className="mb-2 font-semibold text-gray-200 uppercase tracking-wide">Active Users</p>
          <ul className="list-disc list-inside max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {users.map((user) => (
              <li
                key={user.userId}
                className={`px-2 py-1 rounded ${user.username === username ? "bg-blue-600 font-semibold text-white" : "hover:bg-gray-700"}`}
                title={user.username === username ? "You" : user.username}
              >
                {user.username === username ? "You" : user.username}
              </li>
            ))}
          </ul>
    
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #2d3748; /* gray-800 */
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #4a5568; /* gray-600 */
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #6b7280; /* gray-500 */
            }
          `}</style>
        </div>
      </div>
    </aside>
  );
}