import { MutableRefObject } from "react";

export const handleOffer = async (
  offer: RTCSessionDescriptionInit,
  senderId: string,
  createPeerConnection: (id: string) => RTCPeerConnection,
  webSocketRef: MutableRefObject<WebSocket | null>,
  roomId: string,
  userId: string,
  iceCandidatesQueue: { [id: string]: RTCIceCandidateInit[] }
) => {
  const peerConnection = createPeerConnection(senderId);
  console.log("Received offer from user:", senderId);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  webSocketRef.current?.send(
    JSON.stringify({
      action: "answer",
      roomId,
      answer: peerConnection.localDescription,
      userId,
      senderId,
    })
  );

  // 원격 설명이 설정된 후 대기열에 있는 ICE 후보를 추가
  if (iceCandidatesQueue[senderId]) {
    for (const candidate of iceCandidatesQueue[senderId]) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    delete iceCandidatesQueue[senderId];
  }
};

export const handleAnswer = async (
  answer: RTCSessionDescriptionInit,
  senderId: string,
  peerConnections: { [id: string]: RTCPeerConnection },
  iceCandidatesQueue: { [id: string]: RTCIceCandidateInit[] }
) => {
  const peerConnection = peerConnections[senderId];
  if (peerConnection) {
    console.log("Received answer from user:", senderId);
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    // 원격 설명이 설정된 후 대기열에 있는 ICE 후보를 추가
    if (iceCandidatesQueue[senderId]) {
      for (const candidate of iceCandidatesQueue[senderId]) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
      delete iceCandidatesQueue[senderId];
    }
  }
};

export const handleCandidate = async (
  candidate: RTCIceCandidateInit,
  senderId: string,
  peerConnections: { [id: string]: RTCPeerConnection },
  iceCandidatesQueue: { [id: string]: RTCIceCandidateInit[] }
) => {
  const peerConnection = peerConnections[senderId];
  if (peerConnection) {
    if (peerConnection.remoteDescription) {
      console.log("Adding ICE candidate from user:", senderId);
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      console.log("Queueing ICE candidate from user:", senderId);
      if (!iceCandidatesQueue[senderId]) {
        iceCandidatesQueue[senderId] = [];
      }
      iceCandidatesQueue[senderId].push(candidate);
    }
  }
};

export const handleUserLeft = (
  userId: string,
  peerConnections: { [id: string]: RTCPeerConnection },
  setRemoteStreams: React.Dispatch<
    React.SetStateAction<{ [id: string]: MediaStream }>
  >
) => {
  // 상태에서 해당 유저의 스트림 제거
  setRemoteStreams((prevStreams) => {
    const newStreams = { ...prevStreams };
    delete newStreams[userId];
    return newStreams;
  });

  // 피어 연결 정리
  if (peerConnections[userId]) {
    peerConnections[userId].close();
    delete peerConnections[userId];
  }
};
