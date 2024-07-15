import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleUserLeft,
} from "./handlers";

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
  const userId = useRef<string>(Math.random().toString(36).substring(7));
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const iceCandidatesQueue = useRef<{ [id: string]: RTCIceCandidateInit[] }>(
    {}
  ).current;

  const [showReservedSongs, setShowReservedSongs] = useState(false); // 예약된 곡 목록 보기 상태

  const handleShowReservedSongs = () => {
    setShowReservedSongs(!showReservedSongs); // 예약된 곡 목록 보기 토글
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
          console.log("User joined:", message.userId);

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

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
      <div className="p-4">
        <h3 className="mb-4 text-lg font-semibold">예약된 곡 목록</h3>
        <ul>
          <li>곡 1</li>
          <li>곡 2</li>
          <li>곡 3</li>
        </ul>
      </div>
      <div
        style={{
          flexDirection: "column",
          alignItems: "center",
          width: "15%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {selectedUser && remoteStreams[selectedUser] && (
            <div style={{ width: "100%", height: "100%" }}>
              <RemoteVideo stream={remoteStreams[selectedUser]} />
            </div>
          )}
        </div>
        <div>
          {Object.keys(remoteStreams).map((id) => (
            <button key={id} onClick={() => handleUserSelect(id)}>
              Show User {id}
            </button>
          ))}
        </div>
        <section className="flex flex-col py-4">
          <button className="p-2 mb-2 text-white bg-blue-500 rounded hover:bg-blue-600">
            박수
          </button>
          <button className="p-2 mb-2 text-white bg-blue-500 rounded hover:bg-blue-600">
            미러볼
          </button>
          <button
            className="p-2 mb-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            onClick={handleShowReservedSongs}
          >
            노래 끝내기
          </button>
        </section>
      </div>
      <div className="flex-grow mx-4">
        {/* 여기에 유튜브 영상을 넣습니다 */}
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
      <div className="flex flex-col">
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
        {/* 메시지 입력창 */}
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
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default RoomPage;
