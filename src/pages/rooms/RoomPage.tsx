import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { handleOffer, handleAnswer, handleCandidate } from "./handlers";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const [peerConnections, setPeerConnections] = useState<{ [id: string]: RTCPeerConnection }>({});
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({});
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const userId = useRef<string>(Math.random().toString(36).substring(7));

  const createPeerConnection = useCallback(
    (id: string) => {
      console.log("Creating peer connection with user:", id);
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      peerConnection.onicecandidate = (event) => {
        console.log("Sending ICE candidate to user:", id);
        if (event.candidate && webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(
            JSON.stringify({
              action: "ice-candidate",
              roomId,
              candidate: event.candidate,
              userId: userId.current,
              targetId: id,
            })
          );
        }
      };

      peerConnection.ontrack = (event) => {
        console.log("Received remote track from user:", id);
        const remoteMediaStream = event.streams[0];
        setRemoteStreams((prevStreams) => ({ ...prevStreams, [id]: remoteMediaStream }));
      };

      localStream?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      setPeerConnections((prevConnections) => ({ ...prevConnections, [id]: peerConnection }));

      return peerConnection;
    },
    [localStream, roomId]
  );

  

  useEffect(() => {
    if (webSocketRef.current) return;
    if (!roomId) return;

    const socket = new WebSocket("wss://e4w7206ka6.execute-api.ap-northeast-2.amazonaws.com/production");
    webSocketRef.current = socket;

    socket.onopen = () => {      
      webSocketRef.current?.send(
        JSON.stringify({ 
          action: "join-room",
          roomId,
          userId: userId.current 
        })
      );
      console.log("WebSocket connected");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message.action);

        if (message.action === "user-joined" && message.userId !== userId.current) {
          console.log("User joined:", message.userId);
          const peerConnection = createPeerConnection(message.userId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          webSocketRef.current?.send(
            JSON.stringify({
              action: "offer",
              roomId,
              offer: peerConnection.localDescription,
              userId: userId.current,
              targetId: message.userId,
            })
          );
          console.log("Creating offer for new user:", message.userId);
        }

        if (message.action === "chat-message" && message.userId !== userId.current && message.roomId === roomId) {
          handleChatMessage({ sender: "you", text: message.message.text });
        }

        if (message.action === "offer" && message.userId !== userId.current) {
          await handleOffer(message.offer, message.userId, createPeerConnection, webSocketRef, roomId, userId.current);
        }

        if (message.action === "answer" && message.userId !== userId.current) {
          await handleAnswer(message.answer, message.userId, peerConnections);
          console.log("Received answer from user:", message.userId);
        }

        if (message.action === "ice-candidate" && message.userId !== userId.current) {
          await handleCandidate(message.candidate, message.userId, peerConnections);
        }

      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.close();
      }
    };
  }, [roomId, createPeerConnection, handleOffer, handleAnswer, handleCandidate]);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Local stream obtained");
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices or creating peer connection:", error);
      }
    };

    init();
  }, []);

  const handleChatMessage = (message: { sender: string; text: string }) => {
    console.log(`Received chat message: ${message.text}`);
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const sendMessage = () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      const message = inputMessage.trim();
      if (message) {
        const chatMessage = { sender: "Me", text: message };
        webSocketRef.current.send(
          JSON.stringify({
            action: "sendmessage",
            roomId,
            userId: userId.current,
            message: chatMessage,
          })
        );
        setMessages((prevMessages) => [...prevMessages, chatMessage]);
        setInputMessage("");
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h2>Room {roomId} Video Call</h2>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {localStream && (
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "50%" }} />
          )}
          {Object.keys(remoteStreams).map((id) => (
            <div key={id} style={{ width: "100%", height: "50%" }}>
              <RemoteVideo stream={remoteStreams[id]} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col h-screen">
        <div className="flex-grow p-4 overflow-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === "Me" ? "justify-end" : "justify-start"} mb-4`}>
              {message.sender !== "Me" && (
                <img src="https://source.unsplash.com/random/50x50" className="object-cover w-8 h-8 rounded-full" alt="" />
              )}
              <div className={`py-3 px-4 rounded-3xl text-white ${message.sender === "Me" ? "bg-blue-400" : "bg-gray-400"} ml-2`}>
                {message.text}
              </div>
              {message.sender === "Me" && (
                <img src="https://source.unsplash.com/random/50x50" className="object-cover w-8 h-8 rounded-full" alt="" />
              )}
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-300">
          <input
            className="w-full px-3 py-2 rounded-xl"
            type="text"
            placeholder="type your message here..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
        </div>
      </div>
    </div>
  );
};

const RemoteVideo: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      console.log("Setting remote video stream");
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%" }} />;
};

export default RoomPage;
