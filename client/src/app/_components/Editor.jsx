"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CodeEditor({ socket, roomId, username }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [users, setUsers] = useState([]);
  const [userId] = useState(uuidv4());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const updatingEditorFromSocket = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ users, message }) => {
      console.log("👥 Updated user list:", users);
      toast.success(message || "A user joined the room");
      setUsers(Array.isArray(users) ? users : []);
      setActiveUsers(users);
    };

    const handleUserLeft = ({ users, message }) => {
      toast.info(message || "A user left the room");
      setUsers(Array.isArray(users) ? users : []);
      setActiveUsers(users);
    };

    socket.on("user-joined", handleUserJoined);

    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket]);

  
  const handleChange = useCallback((value) => {
    if(!updatingEditorFromSocket.current){
      socket.emit("code-change", { roomId, code: value });
    }
  },[socket, roomId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      socket.emit("cursor-move", { roomId, userId, position });
    });
  };

  useEffect(() => {
    socket.on("code-update", ({ code }) => {
      const editor = editorRef.current;
      if (editor && typeof code === "string") {
        const model = editor.getModel();
        if (model && code !== model.getValue()) {
          updatingEditorFromSocket.current = true;
          model.setValue(code);
          updatingEditorFromSocket.current = false;
        }
      }
    });


    socket.on("cursor-update", ({ userId: otherId, position }) => {
      if (otherId === userId) return;
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (editor && model) {
        editor.deltaDecorations([], [
          {
            range: new monacoRef.current.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            options: {
              className: "remote-cursor",
              afterContentClassName: "remote-cursor-label",
            },
          },
        ]);
      }
    });

    socket.emit("join-room", { roomId, username });

    return () => {
      socket.off("code-update");
      socket.off("user-joined");
      socket.off("cursor-update");
    };
  }, [socket, roomId, userId, username]);

  const runCode = async () => {
    const code = editorRef.current?.getValue();
    if (!code) {
      setOutput("No code to run.");
      return;
    }

    setIsRunning(true);
    setOutput("Running code...");

    const languageMap = {
      javascript: 63,
      python: 71,
      java: 62,
      c: 50,
      cpp: 54,
    };
    const languageId = languageMap[language] || 63;

    try {
      const response = await fetch(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*",
        {
          method: "POST",
          headers: {
            "x-rapidapi-key": process.env.NEXT_PUBLIC_JUDGE0_API_KEY,
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language_id: languageId,
            source_code: btoa(code),
            stdin: btoa(input),
          }),
        }
      );

      const data = await response.json();
      const token = data.token;
      if (!token) throw new Error("No token from Judge0.");

      const result = await pollSubmission(token);
      const stdout = result.stdout ? atob(result.stdout) : "";
      const stderr = result.stderr ? atob(result.stderr) : "";
      const compileOutput = result.compile_output
        ? atob(result.compile_output)
        : "";

      setOutput(stdout || stderr || compileOutput || "Execution completed.");
    } catch (err) {
      console.error(err);
      setOutput("Execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const pollSubmission = async (token) => {
    const url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`;
    const headers = {
      "x-rapidapi-key": process.env.NEXT_PUBLIC_JUDGE0_API_KEY,
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    };
    let retries = 20;
    while (retries--) {
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.status?.id <= 2) await new Promise((r) => setTimeout(r, 1000));
      else return data;
    }
    throw new Error("Timeout polling Judge0");
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("Room ID copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 md:static md:flex-shrink-0"
          }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Close button on mobile */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-xl font-semibold text-center flex-grow">
              Controls
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
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

          <label className="mb-2 font-medium">Language</label>
          <select
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

          <label className="mb-2 font-medium">Theme</label>
          <select
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
            className={`mt-auto px-6 py-3 rounded font-bold ${isRunning ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"
              }`}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md text-sm text-gray-300 max-w-xs">
            <p className="mb-2 font-semibold text-gray-200 uppercase tracking-wide">
              Active Users
            </p>
            <ul className="list-disc list-inside max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {users.map((user) => (
                <li
                  key={user.userId}
                  className={`px-2 py-1 rounded ${user.username === username ? "bg-blue-600 font-semibold text-white" : "hover:bg-gray-700"
                    } transition-colors duration-200 cursor-default`}
                  title={user.username === username ? "You" : user.username}
                >
                  {user.username === username ? "You" : user.username}
                </li>
              ))}
            </ul>
            <style jsx>{`
    /* Same custom scrollbar styles as before */
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

      {/* Main content */}
      <div className="flex flex-col flex-1 ml-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-gray-800 p-3 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open sidebar"
          >
            {/* Hamburger icon */}
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Code Editor</h1>
          <div />
        </header>

        {/* Editor and Input/Output */}
        <main className="sm:flex w-full flex-1 gap-4 p-4 overflow-hidden">
          {/* Code Editor */}
          <div className="w-full sm:w-2/3 border border-gray-700 rounded overflow-hidden h-[60vh] sm:h-auto">
            <Editor
              height="100%"
              theme={theme}
              language={language}
              defaultValue={"// Grind here..."}
              onMount={handleEditorDidMount}
              onChange={handleChange}
              options={{ fontSize: 16, minimap: { enabled: false } }}
            />
          </div>

          {/* Input + Output stacked */}
          <div className="sm:w-1/3 pt-5 sm:pt-0 w-full flex flex-col gap-4 h-[40vh] sm:h-auto">
            {/* Input */}
            <div className="flex-1 bg-gray-800 rounded p-3 overflow-auto">
              <h3 className="text-gray-400 text-sm mb-2">Input (stdin):</h3>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-[85%] bg-gray-700 text-white p-2 rounded resize-none"
                placeholder="Enter custom input for your code..."
              />
            </div>

            {/* Output */}
            <div className="flex-1 bg-gray-800 rounded p-3 overflow-auto">
              <h3 className="text-gray-400 text-sm mb-2">Output:</h3>
              <pre
                className={`text-sm whitespace-pre-wrap break-words max-h-full overflow-auto ${output.toLowerCase().includes("error")
                  ? "text-red-400"
                  : "text-green-400"
                  }`}
              >
                {output}
              </pre>
            </div>
          </div>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
