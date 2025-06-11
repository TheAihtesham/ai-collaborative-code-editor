"use client";

import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { initSocket } from "../../libs/socket";
import { useEffect, useState, useRef } from "react"; 

const CodeEditor = dynamic(() => import("../../_components/Editor"), { ssr: false });

export default function RoomPage() {
  const { id: roomId } = useParams();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "Anonymous";
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    
    let currentSocket = socketRef.current;
    if (!currentSocket) {
        currentSocket = initSocket(); 
        socketRef.current = currentSocket; 
    }
   
    const handleConnect = () => {
      currentSocket.emit("join-room", { roomId, username });
    };

    const handleConnectError = (err) => { 
        console.error("Socket connection error in RoomPage useEffect:", err.message, err);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("connect_error", handleConnectError);

    if (currentSocket.connected) {
      handleConnect(); 
    }

    setSocket(currentSocket); 
    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("connect_error", handleConnectError);

      setSocket(null); 
    };
  }, [roomId, username]); 

  if (!socket) return <div>Loading editor...</div>;

  return (
    <main className=" w-full h-screen">
      <CodeEditor socket={socket} roomId={roomId} username={username} />
    </main>
  );
}
