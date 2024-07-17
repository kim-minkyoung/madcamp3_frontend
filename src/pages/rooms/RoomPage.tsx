import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const Navigate = useNavigate();
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

  const roomService = new RoomService();
  const userService = new UserService();

  const [showClapEffect, setShowClapEffect] = useState(false);
  const [showMirrorball, setShowMirrorball] = useState(false);
  const [showBlinkEffect, setShowBlinkEffect] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [rankMode, setRankMode] = useState<boolean>(false);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [scoring, setScoring] = useState<boolean>(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchOwner = async () => {
      const room = await roomService.getRoomById(parseInt(roomId));
      if (room) {
        setOwnerId(room.owner_id);
        setRankMode(room.rank_mode);
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
          targetId: ownerId,
        })
      );
    }
  };

  const handleEnd = async () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      webSocketRef.current.send(
        JSON.stringify({
          action: "end",
          roomId,
          userId: userId.current,
        })
      );
    }
  };

  const handleSelectUser = (userId: string) => {
    setScoring(false);
    webSocketRef.current?.send(
      JSON.stringify({
        action: "start",
        roomId,
        targetId: userId,
      })
    );
  };

  const handleSubmitScore = async () => {
    if (selectedUser && score) {
      await roomService.updateScore(parseInt(roomId), selectedUser, score);
      console.log("Score submitted:", score);
      const updatedRoomUsers = await handleSetRoom();
      setRoomUsers(updatedRoomUsers);
      setScoring(false);
      setScore(0);
    }
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

  // 사람 들어오고 나갈 때마다 roomUsers 바꿈
  // const handleSetRoom = async () => {
  //   const usersInRoom = await roomService.getAllUsersInRoom(parseInt(roomId));
  //   setRoomUsers(usersInRoom);
  //   // console.log("handleSetRoom roomUsers:", roomUsers);
  //   return roomUsers;
  // };
  // // 여기서는 roomUsers가 정상적으로 update 됨을 확인할 수 있음
  // // handleSetRoom().then((roomUsers) => {
  // //   console.log("roomUsers after handleSetRoom:", roomUsers);
  // // });
  const handleSetRoom = useCallback(async () => {
    try {
      const usersInRoom = await roomService.getAllUsersInRoom(parseInt(roomId));

      const usersWithScores = await Promise.all(
        usersInRoom.map(async (user) => {
          const score = await roomService.getUserScoreInRoom(
            parseInt(roomId),
            user.user_id
          );
          return { ...user, scores: [score] };
        })
      );

      setRoomUsers(usersWithScores);
      return usersWithScores;
    } catch (error) {
      console.error("Error fetching users in room:", error);
      return [];
    }
  }, [roomId, roomService]);

  const handleEndGame = async () => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      setScoring(false);
      if (rankMode) roomService.updateTotalScores(parseInt(roomId));
      roomService.closeRoom(parseInt(roomId));
      webSocketRef.current.send(
        JSON.stringify({
          action: "endGame",
          roomId,
          userId: userId.current,
        })
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
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
      const updatedRoomUsers = await handleSetRoom();

      setRoomUsers(updatedRoomUsers);
      console.log("onopen user-joined roomUsers: ", roomUsers);
      // TODO: 하지만 useEffect 문 내부에서 roomUsers를 찍어보면 빈 배열 나옴
      // .then(() => {
      //   // handleOffer 함수가 완료된 후에 실행될 코드
      //   console.log("onopen user-joined roomUsers: ", roomUsers);
      //   // 추가적인 작업 수행
      // })
      // .catch((error) => {
      //   // handleOffer 함수 호출 중 에러 발생 시 처리
      //   console.error("handleOffer failed:", error);
      // });

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
          // TODO
          // .then(() => {
          //   // handleOffer 함수가 완료된 후에 실행될 코드
          //   console.log("onmessage user-joined roomUsers: ", roomUsers);
          //   // 추가적인 작업 수행
          // })
          // .catch((error) => {
          //   // handleOffer 함수 호출 중 에러 발생 시 처리
          //   console.error("handleOffer failed:", error);
          // });
        }

        if (
          message.action === "chat-message" &&
          message.userId !== userId.current &&
          message.roomId === roomId
        ) {
          handleChatMessage({
            sender: message.userId,
            text: message.message.text,
          });
        }

        if (message.action === "offer" && message.userId !== userId.current) {
          handleOffer(
            message.offer,
            message.userId,
            createPeerConnection,
            webSocketRef,
            roomId,
            userId.current,
            iceCandidatesQueue
          );
          // TODO
          // .then(() => {
          //   // handleOffer 함수가 완료된 후에 실행될 코드
          //   console.log("handleOffer roomUsers: ", roomUsers);
          //   // 추가적인 작업 수행
          // })
          // .catch((error) => {
          //   // handleOffer 함수 호출 중 에러 발생 시 처리
          //   console.error("handleOffer failed:", error);
          // });
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
          // console.log(peerConnectionsRef.current); // Debug: 확인용
          // console.log("ice-candidate roomUsers: ", roomUsers); //TODO
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
          setSelectedUser(message.targetId);
          await handleSetRoom();
        }

        if (message.action === "end") {
          setScoring(true);
        }

        if (message.action === "endGame") {
          setScoring(false);
          setSelectedUser(null);
          setFinished(true);
          await handleSetRoom();
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
  }, [
    roomId,
    createPeerConnection,
    localStream,
    iceCandidatesQueue,
    roomUsers,
  ]);

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
        const chatMessage = { sender: userId.current, text: message };
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
    <div
      className={`w-full h-screen ${showBlinkEffect ? "animate-blink" : ""}`}
    >
      <div style={{ display: "flex", flexDirection: "row", height: "70vh" }}>
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
                      {user.user_id === selectedUser && (
                        <span className="text-xs font-medium text-red-500">
                          on_air
                        </span>
                      )}
                      {user.scores[0] !== -1 && user.scores[0] !== 101 && (
                        <span className="text-xs font-medium text-gray-700">
                          {user.scores[0]}점
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <>
          {!finished ? (
            <div className="flex flex-col items-center justify-start w-6/12">
              {selectedUser === null ? (
                <div className="flex items-center justify-center h-full">
                  {userId.current === ownerId ? (
                    <button
                      className="p-4 text-white bg-blue-600 rounded"
                      onClick={handleStart}
                    >
                      방 시작
                    </button>
                  ) : (
                    <div className="text-xl text-gray-700">
                      곧 시작할 예정입니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {selectedUser === userId.current
                    ? localStream && <RemoteVideo stream={localStream} />
                    : remoteStreams[selectedUser] && (
                        <RemoteVideo stream={remoteStreams[selectedUser]} />
                      )}
                  {(selectedUser === userId.current ||
                    userId.current === ownerId) && (
                    <button
                      className="p-4 mt-4 text-white bg-red-600 rounded"
                      onClick={handleEnd}
                    >
                      🎤 자랑 끝내기 🎤
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-start w-6/12">
              <div className="text-xl text-gray-700">방이 종료되었습니다.</div>
            </div>
          )}
        </>
        <div className="flex flex-col w-3/12 ml-12">
        <div id="chat-container" className="flex-grow p-4 overflow-auto">
          {messages.map((message, index) => {
            const user = roomUsers.find(
              (user) => user.user_id === message.sender
            ) as User;

            const userName = user ? user.user_name : "Unknown User";
            const userImage = user
              ? user.user_image : null;
            return (
              <div
                key={index}
                className={`flex ${
                  message.sender === userId.current ? "justify-end" : "justify-start"
                } mb-4`}
              >
                {message.sender !== userId.current && (
                  <img
                    src={userImage? userImage : "https://previews.123rf.com/images/kurhan/kurhan1704/kurhan170400964/76701347-%ED%96%89%EB%B3%B5%ED%95%9C-%EC%82%AC%EB%9E%8C-%EC%96%BC%EA%B5%B4.jpg"}
                    className="object-cover w-8 h-8 rounded-full"
                    alt={userName}
                  />
                )}
                <div
                  className={`mx-2 py-2 px-3 rounded-3xl text-white ${
                    message.sender === userId.current ? "bg-blue-400" : "bg-gray-400"
                  } ml-2`}
                >
                  <p className="font-bold">{userName}</p>
                  <p>{message.text}</p>
                </div>
                {message.sender === userId.current && (
                  <img
                    src={userImage? userImage : "https://previews.123rf.com/images/kurhan/kurhan1704/kurhan170400964/76701347-%ED%96%89%EB%B3%B5%ED%95%9C-%EC%82%AC%EB%9E%8C-%EC%96%BC%EA%B5%B4.jpg"}
                    className="object-cover w-8 h-8 rounded-full"
                    alt={userName}
                  />
                )}
              </div>
            );
          })}
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
      </div>

      {scoring && selectedUser === userId.current && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded shadow-lg">
            {roomUsers.filter(
              (user) => user.scores[0] === -1 && selectedUser !== user.user_id
            ).length === 0 ? (
              <div>
                <h2 className="mb-4 text-2xl">방이 종료되었습니다.</h2>
                <button
                  className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                  onClick={handleEndGame} // 게임 끝내기 함수
                >
                  게임 끝내기
                </button>
              </div>
            ) : (
              <div>
                <h2 className="mb-4 text-2xl">사용자를 선택해주세요</h2>
                <div className="grid grid-cols-1 gap-4">
                  {roomUsers
                    .filter(
                      (user) =>
                        user.scores[0] === -1 && selectedUser !== user.user_id
                    )
                    .map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSelectUser(user.user_id)} // 선택한 유저를 처리하는 함수
                      >
                        <img
                          className="w-10 h-10 rounded-full"
                          style={{ objectFit: "cover" }}
                          src={
                            user.user_image ||
                            "https://previews.123rf.com/images/kurhan/kurhan1704/kurhan170400964/76701347-%ED%96%89%EB%B3%B5%ED%95%9C-%EC%82%AC%EB%9E%8C-%EC%96%BC%EA%B5%B4.jpg"
                          }
                          alt={`${user.user_name} image`}
                        />
                        <span className="ml-4 text-sm font-medium text-gray-900">
                          {user.user_name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {scoring && selectedUser !== userId.current && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded shadow-lg">
            <h2 className="mb-4 text-2xl">점수를 매겨주세요</h2>
            <input
              type="number"
              className="w-full px-3 py-2 mb-4 border rounded"
              placeholder="점수를 입력하세요"
              onChange={(e) => setScore(parseInt(e.target.value))}
            />
            <button
              className="w-full p-2 text-white bg-blue-600 rounded"
              onClick={handleSubmitScore} // 점수 제출을 처리하는 함수
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const RemoteVideo: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      console.log("Setting remote video stream", stream);
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
