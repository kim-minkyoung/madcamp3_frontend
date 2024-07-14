import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [inputMessage, setInputMessage] = useState("");
  const userId = useRef<string>(Math.random().toString(36).substring(7));

  useEffect(() => {
    const init = async () => {
      const socket = new WebSocket(
        "wss://e4w7206ka6.execute-api.ap-northeast-2.amazonaws.com/production/"
      );
      webSocketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
        socket.send(JSON.stringify({ action: "join-room", roomId }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received raw message:", event.data);
          console.log("Parsed message:", message);
          console.log("message.userId.current:", message.userId.current);
          console.log("userId.current:", userId.current);

          if (
            message.action === "chat-message" &&
            message.userId.current !== userId.current
          ) {
            handleChatMessage({ sender: "you", text: message.message.text });
          }

          // Handle other types of messages as needed
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

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [
            {
              urls: "stun:stun.l.google.com:19302",
            },
          ],
        });
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
          const remoteMediaStream = event.streams[0];
          setRemoteStream(remoteMediaStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteMediaStream;
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (
            event.candidate &&
            webSocketRef.current?.readyState === WebSocket.OPEN
          ) {
            webSocketRef.current.send(
              JSON.stringify({
                action: "ice-candidate",
                roomId,
                candidate: event.candidate,
              })
            );
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        if (webSocketRef.current?.readyState === WebSocket.OPEN) {
          webSocketRef.current.send(
            JSON.stringify({
              action: "offer",
              roomId,
              offer: peerConnection.localDescription,
            })
          );
        }
      } catch (error) {
        console.error(
          "Error accessing media devices or creating peer connection:",
          error
        );
      }
    };

    init();

    return () => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.close();
      }
    };
  }, [roomId]);

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
            userId,
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2>Room {roomId} Video Call</h2>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="transform-none"
              style={{ width: "100%", height: "50%" }}
            ></video>
          )}
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="transform-none"
              style={{ width: "100%", height: "50%" }}
            ></video>
          )}
        </div>
      </div>
      <div className="flex flex-col h-screen">
        <div className="flex-grow p-4 overflow-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "Me" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              {message.sender !== "Me" && (
                <img
                  src="https://source.unsplash.com/random/50x50"
                  className="object-cover w-8 h-8 rounded-full"
                  alt=""
                />
              )}
              <div
                className={`py-3 px-4 rounded-3xl text-white ${
                  message.sender === "Me"
                    ? "bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl"
                    : "bg-gray-400 rounded-br-3xl rounded-tr-3xl rounded-tl-xl ml-2"
                }`}
              >
                {message.text}
              </div>
              {message.sender === "Me" && (
                <img
                  src="https://source.unsplash.com/random/50x50"
                  className="object-cover w-8 h-8 rounded-full"
                  alt=""
                />
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
          <button className="hidden" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
