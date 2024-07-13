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
        console.log("Received message:", event.data);
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
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

  const handleMessage = (message: any) => {
    console.log("Received message:", message);
    const { action, data } = message;
    switch (action) {
      case "offer":
        handleReceiveOffer(data.offer);
        break;
      case "answer":
        handleReceiveAnswer(data.answer);
        break;
      case "ice-candidate":
        handleReceiveICECandidate(data.candidate);
        break;
      case "chat-message":
        handleChatMessage(data.message);
        break;
      default:
        console.warn("Unhandled message:", message);
        break;
    }
  };

  const handleReceiveOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      webSocketRef.current?.send(
        JSON.stringify({
          action: "answer",
          roomId,
          answer: peerConnectionRef.current.localDescription,
        })
      );
      handleChatMessage("ㅇㅇ1");
    } catch (error) {
      console.error("Error handling received offer:", error);
    }
  };

  const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
      handleChatMessage("ㅇㅇ2");
    } catch (error) {
      console.error("Error handling received answer:", error);
    }
  };

  const handleReceiveICECandidate = async (candidate: RTCIceCandidate) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
      handleChatMessage("ㅇㅇ3");
    } catch (error) {
      console.error("Error handling received ICE candidate:", error);
    }
  };

  const handleEndCall = () => {
    // Additional logic to end call if needed
  };

  const handleSendChat = () => {
    const chatInput = document.getElementById("chatInput") as HTMLInputElement;
    const message = chatInput.value.trim();
    if (message) {
      sendMessage(message);
      chatInput.value = "";
    }
  };

  const sendMessage = (message: string) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({
          action: "chat-message",
          roomId,
          message,
        })
      );
      console.log(`보낸 사람: ${message}`);
    }
  };

  const handleChatMessage = (message: string) => {
    console.log(`받은 사람: ${message}`);
    // 채팅 메시지를 UI에 추가하는 코드를 여기에 추가하세요.
  };

  return (
    <div>
      <h2>Room {roomId} Video Call</h2>
      <div>
        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="transform-none"
          ></video>
        )}
        {localStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="transform-none"
          ></video>
        )}
      </div>
      <div>
        <input type="text" id="chatInput" />
        <button onClick={handleSendChat}>Send</button>
      </div>
      <button onClick={handleEndCall}>End Call</button>
    </div>
  );
};

export default RoomPage;
