// src/pages/MainPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import RoomList from "../../components/RoomList";
import { Room, RoomService } from "../../services/RoomService"; // RoomService import

const MainPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const roomServiceInterface = new RoomService(); // RoomService 인터페이스 생성
        const data = await roomServiceInterface.getAllOpenRooms();
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleRoomClick = (roomId: number) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoomClick = () => {
    navigate("/create-room");
  };

  return (
    <div>
      <button onClick={handleCreateRoomClick}>방 생성</button>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <RoomList rooms={rooms} onRoomClick={handleRoomClick} />
      )}
    </div>
  );
};

export default MainPage;
