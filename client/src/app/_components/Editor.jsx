"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SidebarControls } from "./SidebarControls";
import { CodeEditorPanel } from "./MonacoEditor";
import { InputOutputPanel } from "./InputOutput";

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
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Effect for handling user join/leave notifications
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

  // Callback for handling changes in the code editor
  const handleChange = useCallback((value) => {
    if (!updatingEditorFromSocket.current) {
      socket.emit("code-change", { roomId, code: value });
    }
  }, [socket, roomId]);

  // Callback for when the Monaco editor is mounted
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true); // Set editor ready flag to true

    // Emit cursor position changes to other users
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      socket.emit("cursor-move", { roomId, userId, position });
    });
  };

  // Effect for handling real-time code updates and initial code loading
  useEffect(() => {
    if (!socket) return; 

    // Handler for real-time code updates from other users
    const handleCodeUpdate = ({ code }) => {
      const editor = editorRef.current;
      if (editor && typeof code === "string") {
        const model = editor.getModel();
        if (model && code !== model.getValue()) {
          updatingEditorFromSocket.current = true; 
          model.setValue(code); 
          updatingEditorFromSocket.current = false; 
        } else {
          console.log('[CLIENT] "code-update" received but editor content is identical or model not ready.'); 
        }
      } else {
        console.log('[CLIENT] "code-update" received but editorRef.current is null or code is not a string.'); 
      }
    };

    // Handler for initial code load when a user joins
    const handleLoadCode = (code) => {
  
      const editor = editorRef.current;
      if (editor && typeof code === "string") {
        const model = editor.getModel();
        
        if (model && code !== model.getValue()) {
          updatingEditorFromSocket.current = true; 
          model.setValue(code);
          updatingEditorFromSocket.current = false;
        } else {
          console.log('[CLIENT] "load-code" received but editor content is identical or model not ready.'); 
        }
      } else {
        console.log('[CLIENT] "load-code" received but editorRef.current is null or code is not a string.'); 
      }
    };

    // Handler for cursor position updates from other users
    const handleCursorUpdate = ({ userId: otherId, position }) => {
      if (otherId === userId) return; // Ignore own cursor updates
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (editor && model && monacoRef.current) {
        // Add/update decorations for remote cursors
        editor.deltaDecorations([], [
          {
            range: new monacoRef.current.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            options: {
              className: "remote-cursor", // CSS class for cursor styling
              afterContentClassName: "remote-cursor-label", // CSS class for cursor label (e.g., username)
            },
          },
        ]);
      }
    };

   
    socket.on("code-update", handleCodeUpdate);
    socket.on("load-code", handleLoadCode); 
    socket.on("cursor-update", handleCursorUpdate);

    if (isEditorReady) {
        socket.emit("join-room", { roomId, username });
    } else {
        console.log(`[CLIENT] Editor not ready yet, delaying 'join-room' emit for ${username}.`); // DEBUG
    }



    return () => {

      socket.off("code-update", handleCodeUpdate);
      socket.off("load-code", handleLoadCode);
      socket.off("cursor-update", handleCursorUpdate);
    };
  }, [socket, roomId, userId, username, isEditorReady]); 

 
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

  // Function to copy the room ID to clipboard
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard!");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Failed to copy Room ID.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Overlay for sidebar on mobile */}
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
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 ml-0 overflow-hidden">
        {/* Mobile header with sidebar toggle */}
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
          {/* Code Editor Panel */}
          <div className="w-full sm:w-2/3 border border-gray-700 rounded overflow-hidden h-[60vh] sm:h-auto">
            <CodeEditorPanel
              language={language}
              theme={theme}
              onChange={handleChange}
              onMount={handleEditorDidMount}
            />
          </div>

          {/* Input/Output Panel */}
          <div className="sm:w-1/3 pt-5 sm:pt-0 w-full flex flex-col gap-4 h-[40vh] sm:h-auto">
            <InputOutputPanel
              input={input}
              setInput={setInput}
              output={output}
            />
          </div>
        </main>
      </div>
      {/* Toast notifications container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
