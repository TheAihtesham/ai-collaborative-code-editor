"use client";

import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { initSocket } from "../../libs/socket";
import { useEffect, useState, useRef } from "react"; 

const CodeEditor = dynamic(() => import("../../_components/Editor"), { ssr: false });

export default function RoomPage() {
  console.log("RoomPage: Component rendering start.");
  const { id: roomId } = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "Anonymous";
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("RoomPage: useEffect starting for roomId:", roomId, "username:", username);

    let currentSocket = socketRef.current;
    if (!currentSocket) {
        currentSocket = initSocket(); 
        socketRef.current = currentSocket; 
    }
    console.log("RoomPage: initSocket returned socket instance.", currentSocket.id, "connected:", currentSocket.connected);

    const handleConnect = () => {
      console.log("Socket connected:", currentSocket.id);
      currentSocket.emit("join-room", { roomId, username });
    };

    const handleConnectError = (err) => { 
        console.error("Socket connection error in RoomPage useEffect:", err.message, err);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("connect_error", handleConnectError);

    if (currentSocket.connected) {
      console.log("Socket already connected, immediately joining room.");
      handleConnect(); 
    }

    setSocket(currentSocket); 
    return () => {
      console.log("RoomPage: useEffect cleanup. Detaching listeners.");
      currentSocket.off("connect", handleConnect);
      currentSocket.off("connect_error", handleConnectError);

      setSocket(null); 
    };
  }, [roomId, username]); 

  console.log("RoomPage: Component rendering end. Socket in state:", socket);

  if (!socket) return <div>Loading editor...</div>;

  return (
    <main className=" w-full">
      <CodeEditor socket={socket} roomId={roomId} username={username} />
    </main>
  );
}
