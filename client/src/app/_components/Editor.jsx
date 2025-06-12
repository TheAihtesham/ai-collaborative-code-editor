"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SidebarControls } from "./SidebarControls";
import { CodeEditorPanel } from "./MonacoEditor";
import { InputOutputPanel } from "./InputOutput";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [thinking, isThinking] = useState(false);

  const [showAiResponseOverlay, setShowAiResponseOverlay] = useState(false);

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

    const handleAiRespone = ({ response }) => {
      setAiResponse(response);
      isThinking(false);
      setShowAiResponseOverlay(true);

    }

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("ai-response", handleAiRespone);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("ai-response", handleAiRespone);
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
    setIsEditorReady(true);
  };

  // Effect for handling real-time code updates and initial code loading
  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = ({ code }) => {
      const editor = editorRef.current;
      if (editor && typeof code === "string") {
        const model = editor.getModel();
        if (model && code !== model.getValue()) {
          updatingEditorFromSocket.current = true;
          model.setValue(code);
          updatingEditorFromSocket.current = false;
        }
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
        }
      }
    };

    socket.on("code-update", handleCodeUpdate);
    socket.on("load-code", handleLoadCode);

    if (isEditorReady) {
      socket.emit("join-room", { roomId, username });
    }

    return () => {
      socket.off("code-update", handleCodeUpdate);
      socket.off("load-code", handleLoadCode);
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
      const response = await fetch("https://codemate-4fyl.onrender.com/api/run-code", {
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

  const sendAiPrompt = () => {
    if (!aiPrompt.trim()) {
      toast.warn('please enter the prompt');
      return;
    }
    isThinking(true)
    setAiResponse("");
    setShowAiResponseOverlay(true);
    const currentCode = editorRef.current?.getValue() || " ";
    socket.emit('ai-request', {
      prompt: aiPrompt,
      currentCode,
      language
    });
    setAiPrompt(" ");
  }
  const dismissAiOverlay = () => {
    setShowAiResponseOverlay(false);
    setAiResponse("");
  };

  // Markdown renderers
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }) => <p className="text-base mb-2">{children}</p>,
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
  };

  return (
    <div className="flex sm:h-screen bg-gray-900 text-gray-100 ">
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
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        sendAiPrompt={sendAiPrompt}
      />

      <div className="flex flex-col flex-1 ml-0 overflow-hidden relative">
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
          {/* Mobile-only Run Code Button */}
          
          <div />
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`md:hidden py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${isRunning
              ? "bg-green-600 cursor-not-allowed opacity-70"
              : "bg-green-700 hover:bg-green-600"
              }`}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </header>

        <main className="block lg:flex h-full w-full flex-1 gap-4 p-4 overflow-hidden">
          <div className="w-full lg:w-2/3 border border-gray-700 rounded overflow-hidden md:h-[55vh] lg:h-full sm:h-auto">
            <CodeEditorPanel
              language={language}
              theme={theme}
              onChange={handleChange}
              onMount={handleEditorDidMount}
            />
          </div>
          <div className="lg:w-1/3 lg:pt-0 pt-5 md:w-full md:h-[43%] md:pt-[5px] w-full flex flex-col gap-4 lg:h-full h-[45vh] sm:h-auto">
            <InputOutputPanel
              input={input}
              setInput={setInput}
              output={output}
            />
          </div>

        </main>

        {/* Full-page Overlay for AI Response */}
        {showAiResponseOverlay && (
          <div
            className="absolute inset-0 bg-opacity-80 z-40 flex justify-center items-center p-6 bg-black/40 backdrop-blur-sm"
          >

            <div
              className="bg-gray-800 text-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative"

            >
              <button
                onClick={dismissAiOverlay}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                ✖
              </button>
              <h2 className="text-lg font-bold mb-4">
                {thinking ? "AI is thinking..." : "AI Assistant Response"}
              </h2>
              {thinking ? (
                <div className="text-center text-blue-400">Processing...</div>
              ) : (
                <ReactMarkdown components={renderers}>
                  {aiResponse}
                </ReactMarkdown>
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
}
