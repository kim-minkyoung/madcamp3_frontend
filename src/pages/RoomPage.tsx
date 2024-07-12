// RoomPage.tsx
import React from "react";
import { useParams } from "react-router-dom";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  return (
    <div>
      <h2>Room Page</h2>
      <p>Room ID: {roomId}</p>
      {/* 추가적인 방 세부 정보 및 기능을 구현 */}
    </div>
  );
};

export default RoomPage;
