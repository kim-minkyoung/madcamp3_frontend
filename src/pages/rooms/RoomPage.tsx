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
        try {
          const message = JSON.parse(event.data);
          console.log("Received raw message:", event.data);
          console.log("Parsed message:", message);

          if (message.action === "sendMessage") {
            handleChatMessage(message.message);
          }

          // Handle other types of messages as needed
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };

      const handleChatMessage = (message: string) => {
        console.log(`Received chat message: ${message}`);
        // 여기에 채팅 메시지를 UI에 추가하는 로직을 추가하세요.
        // 예를 들어, 메시지를 화면에 출력하거나 채팅 UI 컴포넌트를 업데이트할 수 있습니다.
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
        <button
          onClick={() => {
            if (webSocketRef.current?.readyState === WebSocket.OPEN) {
              const message = (
                document.getElementById("chatInput") as HTMLInputElement
              ).value.trim();
              if (message) {
                webSocketRef.current.send(
                  JSON.stringify({
                    action: "sendmessage",
                    roomId,
                    message,
                  })
                );
                console.log(`Sent chat message: ${message}`);
              }
            }
          }}
        >
          Send
        </button>
      </div>
      <button
        onClick={() => {
          if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            webSocketRef.current.close();
          }
        }}
      >
        End Call
      </button>
    </div>
  );
};

export default RoomPage;
