// SidebarControls.jsx
import React, { useState } from 'react';
// import { Robot, User2 } from 'lucide-react'; // Assuming you use these for icons

// Import ReactMarkdown and SyntaxHighlighter if you want to use them for other purposes in SidebarControls
// For this specific change, they are no longer needed here as the AI response is moved to CodeEditor.jsx
// import ReactMarkdown from 'react-markdown';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


export function SidebarControls({
  users,
  username,
  language,
  setLanguage,
  theme,
  setTheme,
  runCode,
  isRunning,
  copyRoomId,
  sidebarOpen,
  setSidebarOpen,
  aiPrompt,
  setAiPrompt,
  sendAiPrompt, // isThinking and aiResponse are no longer passed here
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'ai'

  // Removed renderers object as ReactMarkdown is no longer used here for AI response

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 text-gray-100 flex flex-col transform md:translate-x-0 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">Collaborate</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-gray-400 hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'users' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'
            } transition-colors duration-200`}
          onClick={() => setActiveTab('users')}
        >
          <span className='inline-block mr-2 h-5 w-5'>👤</span> Users

        </button>
        <button
          className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'ai' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700'
            } transition-colors duration-200`}
          onClick={() => setActiveTab('ai')}
        >
          <span className="inline-block mr-2 h-5 w-5">🤖</span> AI
        </button>
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {activeTab === 'users' && (
          <>
            {/* User List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Online Users ({users.length})</h3>
              <ul className="space-y-2">
                {users.map((user) => (
                  <li key={user.userId} className="flex items-center text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
                    {user.username} {user.username === username && "(You)"}
                  </li>
                ))}
              </ul>
            </div>

            {/* Language and Theme Selectors */}
            <div className="mb-6">
              <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">Language</label>
              <select
                id="language-select"
                className="w-full p-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="theme-select" className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
              <select
                id="theme-select"
                className="w-full p-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="vs-dark">VS Dark</option>
                <option value="light">VS Light</option>
                <option value="hc-black">High Contrast Dark</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-auto">
              <button
                onClick={runCode}
                disabled={isRunning}
                className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${isRunning
                    ? "bg-green-600 cursor-not-allowed opacity-70"
                    : "bg-green-700 hover:bg-green-600"
                  }`}
              >
                {isRunning ? "Running..." : "Run Code"}
              </button>
              <button
                onClick={copyRoomId}
                className="w-full py-2 px-4 rounded-md bg-blue-700 text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
              >
                Copy Room ID
              </button>
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-3 text-gray-200">AI Code Assistant</h3>
            <textarea
              className="w-full p-2 rounded bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 mb-3 resize-none"
              rows="4"
              placeholder="Ask AI about your code or programming..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              // The disabled state for the textarea will now be managed by the overlay
              // This textarea should always be enabled for input in the sidebar
            ></textarea>
            <button
              onClick={sendAiPrompt}
              disabled={!aiPrompt.trim()} // Only disable if prompt is empty
              className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${!aiPrompt.trim()
                  ? "bg-blue-600 cursor-not-allowed opacity-70"
                  : "bg-blue-700 hover:bg-blue-600"
                }`}
            >
              Ask AI {/* No "Thinking..." here, as overlay handles it */}
            </button>
            {/* REMOVED: AI Response Display is now on the full-page overlay */}
          </div>
        )}
      </div>
    </aside>
  );
}
