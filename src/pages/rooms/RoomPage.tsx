import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleUserLeft,
} from "./handlers";
import "../../index.css";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const [remoteStreams, setRemoteStreams] = useState<{
    [id: string]: MediaStream;
  }>({});
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [inputMessage, setInputMessage] = useState("");
  const userId = useRef<string>(localStorage.getItem("userId") || "");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const iceCandidatesQueue = useRef<{ [id: string]: RTCIceCandidateInit[] }>(
    {}
  ).current;

  const [showMirrorball, setShowMirrorball] = useState(false);
  const [showClapEffect, setShowClapEffect] = useState(false);

  const playClapSound = () => {
    const clapAudio = new Audio("../../../public/clapSound.mp3");
    clapAudio.play();
    setShowClapEffect(true);
    setTimeout(() => setShowClapEffect(false), 1000); // Hide after 1 second
  };

  const handleMirrorball = () => {
    setShowMirrorball(true);
    setTimeout(() => setShowMirrorball(false), 3000); // Hide after 5 seconds
  };

  const createPeerConnection = useCallback(
    (id: string) => {
      console.log("Creating PeerConnection for user:", id);
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      peerConnection.onicecandidate = (event) => {
        if (
          event.candidate &&
          webSocketRef.current?.readyState === WebSocket.OPEN
        ) {
          console.log("ICE candidate generated:", event.candidate);
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
        setRemoteStreams((prevStreams) => ({
          ...prevStreams,
          [id]: remoteMediaStream,
        }));
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          console.log("Adding track to PeerConnection:", track);
          peerConnection.addTrack(track, localStream);
        });
      } else {
        console.warn(
          "Local stream is not available when creating PeerConnection"
        );
      }

      peerConnectionsRef.current[id] = peerConnection;

      return peerConnection;
    },
    [localStream, roomId]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true, // TODO: Audio 설정
        });
        console.log("Local stream obtained:", stream);
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log("Local video element set with stream");
        }
      } catch (error) {
        console.error(
          "Error accessing media devices or creating peer connection:",
          error
        );
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!localStream) return; // Wait until localStream is set
    if (webSocketRef.current) return;
    if (!roomId) return;

    const socket = new WebSocket(
      "wss://e4w7206ka6.execute-api.ap-northeast-2.amazonaws.com/production"
    );
    webSocketRef.current = socket;

    socket.onopen = () => {
      webSocketRef.current?.send(
        JSON.stringify({
          action: "join-room",
          roomId,
          userId: userId.current,
        })
      );
      console.log("WebSocket connected");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message.action);

        if (
          message.action === "user-joined" &&
          message.userId !== userId.current
        ) {
          console.log("User joined", message.userId);

          // PeerConnection 생성
          const peerConnection = createPeerConnection(message.userId);

          // 오퍼 생성 및 설정
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          // 오퍼 전송
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

        if (
          message.action === "chat-message" &&
          message.userId !== userId.current &&
          message.roomId === roomId
        ) {
          handleChatMessage({ sender: "you", text: message.message.text });
        }

        if (message.action === "offer" && message.userId !== userId.current) {
          await handleOffer(
            message.offer,
            message.userId,
            createPeerConnection,
            webSocketRef,
            roomId,
            userId.current,
            iceCandidatesQueue
          );
        }

        if (message.action === "answer" && message.userId !== userId.current) {
          await handleAnswer(
            message.answer,
            message.userId,
            peerConnectionsRef.current,
            iceCandidatesQueue
          );
          console.log("Received answer from user:", message.userId);
        }

        if (
          message.action === "ice-candidate" &&
          message.userId !== userId.current
        ) {
          console.log(peerConnectionsRef.current); // Debug: 확인용
          await handleCandidate(
            message.candidate,
            message.userId,
            peerConnectionsRef.current,
            iceCandidatesQueue
          );
        }

        if (
          message.action === "leave-room" &&
          message.userId !== userId.current
        ) {
          console.log("User left:", message.userId);
          handleUserLeft(
            message.userId,
            peerConnectionsRef.current,
            setRemoteStreams
          );
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      webSocketRef.current?.send(
        JSON.stringify({
          action: "leave-room",
          roomId,
          userId: userId.current,
        })
      );
      handleUserLeft(
        userId.current,
        peerConnectionsRef.current,
        setRemoteStreams
      );
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      // Clean up socket and connections
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(
          JSON.stringify({
            action: "leave-room",
            roomId,
            userId: userId.current,
          })
        );
        webSocketRef.current.close();
      }
    };
  }, [roomId, createPeerConnection, localStream, iceCandidatesQueue]);

  useEffect(() => {
    // Clean up on page unload
    const handleBeforeUnload = () => {
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(
          JSON.stringify({
            action: "leave-room",
            roomId,
            userId: userId.current,
          })
        );
        webSocketRef.current.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (webSocketRef.current?.readyState === WebSocket.OPEN) {
        webSocketRef.current.send(
          JSON.stringify({
            action: "leave-room",
            roomId,
            userId: userId.current,
          })
        );
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
            userId: userId.current,
            message: chatMessage,
          })
        );
        setMessages((prevMessages) => [...prevMessages, chatMessage]);
        setInputMessage("");
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
      <div className="w-3/12 overflow-y-auto mr-14">
        <ul role="list" className="divide-y">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
            <li key={item} className="py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    className="w-8 h-8 rounded-full"
                    src="https://flowbite.com/docs/images/people/profile-picture-1.jpg"
                    alt="Neil image"
                  />
                  <div className="grid grid-rows-2 gap-y-1">
                    <span className="text-sm font-medium text-gray-900">
                      Neil Sims
                    </span>
                    <span className="text-sm text-gray-500">
                      팔로워: 100, 팔로잉: 100
                    </span>
                  </div>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  100점
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "50%",
          overflowY: "auto",
        }}
      >
        <div style={{ flex: 1 }}>
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
            />
          )}
          {showClapEffect && (
            <div className="clap-effect">👏</div> // 간단한 박수 효과
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {Object.keys(remoteStreams).map((id) => (
            <div
              key={id}
              style={{ width: "100px", height: "100px", margin: "5px" }}
            >
              <RemoteVideo stream={remoteStreams[id]} />
            </div>
          ))}
        </div>
        <section className="flex">
          <div className="flex flex-wrap justify-center">
            <button
              className="p-3 mx-2 mb-3 text-white transition duration-300 transform bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 hover:rotate-12"
              onClick={playClapSound}
            >
              👏 박수 👏
            </button>
            <button
              className="p-3 mx-2 mb-3 text-white transition duration-300 transform bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 hover:rotate-12"
              onClick={handleMirrorball}
            >
              🕺 미러볼 🕺
            </button>
            <button className="p-3 mx-2 mb-3 text-white transition duration-300 transform bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-105">
              🎤 자랑 끝내기 🎤
            </button>
          </div>
        </section>
        {showMirrorball && (
          <div className="mirrorball">
            <img src="/path/to/mirrorball.gif" alt="Mirrorball" />
          </div>
        )}
      </div>
      <div className="flex flex-col w-3/12 ml-12">
        <div id="chat-container" className="flex-grow p-4 overflow-auto">
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
                className={`mx-2 py-2 px-3 rounded-3xl text-white ${
                  message.sender === "Me" ? "bg-blue-400" : "bg-gray-400"
                } ml-2`}
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
        </div>
      </div>
    </div>
  );
};

const RemoteVideo: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      console.log("Setting remote video stream");
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: "100%", height: "100%", transform: "scaleX(-1)" }}
    />
  );
};

export default RoomPage;
