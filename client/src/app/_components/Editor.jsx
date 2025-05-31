"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import{ SidebarControls }from "./SidebarControls"
import{ CodeEditorPanel }from "./MonacoEditor"
import{ InputOutputPanel }from "./InputOutput"

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
  const updatingEditorFromSocket = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ users, message }) => {
      toast.success(message || "A user joined the room");
      setUsers(Array.isArray(users) ? users : []);
    };

    const handleUserLeft = ({ users, message }) => {
      toast.info(message || "A user left the room");
      setUsers(Array.isArray(users) ? users : []);
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket]);

  const handleChange = useCallback((value) => {
    if (!updatingEditorFromSocket.current) {
      socket.emit("code-change", { roomId, code: value });
    }
  }, [socket, roomId]);

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
      if (editor && model && monacoRef.current) {
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

    try {
      const response = await fetch("http://localhost:8000/api/run-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          input,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to run code via backend");
      }

      const result = await response.json();
      setOutput(result.stdout || result.stderr || result.compile_output || "Execution completed.");
    } catch (err) {
      console.error(err);
      setOutput(`Execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
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
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        />
      )}
         <SidebarControls
          users={users}
          username={username}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          runCode={runCode}
          isRunning={isRunning}
          copyRoomId={copyRoomId}
        />

      <div className="flex flex-col flex-1 ml-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between bg-gray-800 p-3 border-b border-gray-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300"
            aria-label="Open sidebar"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Code Editor</h1>
          <div />
        </header>

        <main className="sm:flex w-full flex-1 gap-4 p-4 overflow-hidden">
          <div className="w-full sm:w-2/3 border border-gray-700 rounded overflow-hidden h-[60vh] sm:h-auto">
            <CodeEditorPanel
              language={language}
              theme={theme}
              onChange={handleChange}
              onMount={handleEditorDidMount}
            />
          </div>

          <div className="sm:w-1/3 pt-5 sm:pt-0 w-full flex flex-col gap-4 h-[40vh] sm:h-auto">
            <InputOutputPanel
              input={input}
              setInput={setInput}
              output={output}
            />
          </div>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
