// src/pages/MainPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import RoomList from "../../components/RoomList";
import { Room, fetchRooms } from "../../services/RoomService"; // RoomService import

const MainPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      try {
        const data = await fetchRooms();
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

  return (
    <div>
      <p>
        이것은 <span className="font-semibold text-gray-800">첫 번째</span> 탭의
        내용입니다.
      </p>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <RoomList rooms={rooms} onRoomClick={handleRoomClick} />
      )}
    </div>
  );
};

export default MainPage;
