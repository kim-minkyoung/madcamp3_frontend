import { MutableRefObject } from "react";

export const handleOffer = async (
  offer: RTCSessionDescriptionInit,
  senderId: string,
  createPeerConnection: (id: string) => RTCPeerConnection,
  webSocketRef: MutableRefObject<WebSocket | null>,
  roomId: string,
  userId: string
) => {
  const peerConnection = createPeerConnection(senderId);
  console.log("Received offer from user:", senderId);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("Sending answer to user:", senderId);
  webSocketRef.current?.send(
    JSON.stringify({
      action: "answer",
      roomId,
      answer: peerConnection.localDescription,
      userId,
      senderId,
    })
  );
};

export const handleAnswer = async (
  answer: RTCSessionDescriptionInit,
  senderId: string,
  peerConnections: { [id: string]: RTCPeerConnection }
) => {
  const peerConnection = peerConnections[senderId];
  if (peerConnection) {
    console.log("Received answer from user:", senderId);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
};

export const handleCandidate = async (
  candidate: RTCIceCandidateInit,
  senderId: string,
  peerConnections: { [id: string]: RTCPeerConnection }
) => {
  const peerConnection = peerConnections[senderId];
  if (peerConnection) {
    console.log("Received ICE candidate from user:", senderId);
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
};
