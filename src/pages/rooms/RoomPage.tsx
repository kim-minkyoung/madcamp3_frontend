import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleUserLeft,
} from "./handlers";
import "../../index.css";
import { Room, RoomService } from "../../services/RoomService";
import { User, UserService } from "../../services/UserService";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>() as { roomId: string };
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
  
  const roomService = new RoomService()
  const userService = new UserService();

  const [showClapEffect, setShowClapEffect] = useState(false);
  const [showMirrorball, setShowMirrorball] = useState(false);
  const [showBlinkEffect, setShowBlinkEffect] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [queue, setQueue] = useState<User[]>([]);

  useEffect(() => {
    const fetchOwner = async () => {
      const room = await roomService.getRoomById(parseInt(roomId));
      if (room) {
        setOwnerId(room.owner_id);
      }
    };
    fetchOwner();
  }, []);

  const playClapSound = () => {
    const clapAudio = new Audio("/clapSound.mp3");
    clapAudio.play();
    setShowClapEffect(true);
    setTimeout(() => setShowClapEffect(false), 1000); // Hide after 1 second
  };

  const sendClap = () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({
          action: "clap",
          roomId,
          userId: userId.current,
        })
      );
    }
  };

  const handleMirrorball = () => {
    setShowMirrorball(true);
    setShowBlinkEffect(true);
    setTimeout(() => {
      setShowMirrorball(false);
      setShowBlinkEffect(false);
    }, 2000);
  };

  const sendMirrorball = () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({
          action: "mirrorball",
          roomId,
          userId: userId.current,
        })
      );
    }
  };

  const handleStart = async () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({
          action: "start",
          roomId,
          userId: userId.current,
        })
      );
    }
  }

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

  const handleSetRoom = async () => {
    const usersInRoom = await roomService.getAllUsersInRoom(parseInt(roomId))
    setRoomUsers(usersInRoom);
  };

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
  
    socket.onopen = async () => {
      if (!roomUsers.find((user) => user.user_id === userId.current)) {
        await roomService.enterRoom(parseInt(roomId), userId.current);
      }
      await handleSetRoom();
      console.log("WebSocket connected");
      webSocketRef.current?.send(
        JSON.stringify({
          action: "join-room",
          roomId,
          userId: userId.current,
        })
      );
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
          await handleSetRoom(); // Fetch users after new user joins
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
          await handleSetRoom(); // Fetch users after a user leaves
        }
  
        if (message.action === "clap") {
          playClapSound();
        }
  
        if (message.action === "mirrorball") {
          handleMirrorball();
        }
  
        if (message.action === "start") {
          if (!selectedUser) {
            console.log(roomUsers);
            // setQueue(roomUsers);
            // setSelectedUser(roomUsers[0].user_id);
          }
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
  
    socket.onclose = async () => {
      console.log("WebSocket disconnected");
      await roomService.deleteUserInRoom(parseInt(roomId), userId.current);
      await handleSetRoom(); // Fetch users after disconnect
      webSocketRef.current?.send(
        JSON.stringify({
          action: "leave-room",
          roomId,
          userId: userId.current,
        })
      );
      handleUserLeft(userId.current, peerConnectionsRef.current, setRemoteStreams);
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
  }, [roomId, createPeerConnection, localStream, iceCandidatesQueue, roomUsers]);

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
    console.log("hi");
  };

  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={`w-full h-screen ${showBlinkEffect ? "animate-blink" : ""}`}
    >
      <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
        <div className="w-3/12 overflow-y-auto mr-14">
          <ul role="list" className="divide-y">
            {roomUsers.map((user) => (
              <li key={user.user_id} className="py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      className="w-10 h-10 rounded-full"
                      style={{ objectFit: "cover" }}
                      src={
                        user.user_image ||
                        "https://previews.123rf.com/images/kurhan/kurhan1704/kurhan170400964/76701347-%ED%96%89%EB%B3%B5%ED%95%9C-%EC%82%AC%EB%9E%8C-%EC%96%BC%EA%B5%B4.jpg"
                      }
                      alt={`${user.user_name} image`}
                    />
                    <div className="grid grid-rows-2 gap-y-1">
                      <span className="text-sm font-medium text-gray-900">
                        {user.user_name}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
  
        {selectedUser === null ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "50%",
              overflowY: "auto",
            }}
          >
            {userId.current === ownerId ? (
              <button 
                className="p-4 text-white bg-blue-600 rounded" 
                onClick={handleStart}
              >
                방 시작
              </button>
            ) : (
              <div className="text-xl text-gray-700">곧 시작할 예정입니다.</div>
            )}
          </div>
        ) : (
          <div className="flex-grow flex">
            <div className="flex flex-col w-1/4 overflow-y-auto">
              {Object.keys(remoteStreams).map((id) => (
                id !== selectedUser && (
                  <div key={id} className="p-2">
                    <RemoteVideo stream={remoteStreams[id]} />
                  </div>
                )
              ))}
            </div>
            <div className="flex-grow flex justify-center items-center">
              {selectedUser === userId.current || userId.current === ownerId ? (
                <div>
                  <RemoteVideo stream={remoteStreams[selectedUser]} />
                  <button className="p-4 text-white bg-red-600 rounded mt-4">
                    🎤 자랑 끝내기 🎤
                  </button>
                </div>
              ) : (
                <RemoteVideo stream={remoteStreams[selectedUser]} />
              )}
            </div>
          </div>
        )}
  
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
  
      <div className="flex flex-wrap justify-center mt-4">
        {selectedUser === null || (selectedUser !== userId.current && userId.current !== ownerId) ? (
          <>
            <button
              className="p-3 mx-2 mb-3 text-white transition duration-300 transform bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 hover:rotate-12"
              onClick={sendClap}
            >
              👏 박수 👏
            </button>
            <button
              className="p-3 mx-2 mb-3 text-white transition duration-300 transform bg-pink-600 rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 hover:rotate-12"
              onClick={sendMirrorball}
            >
              🕺 미러볼 🕺
            </button>
          </>
        ) : null}
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
