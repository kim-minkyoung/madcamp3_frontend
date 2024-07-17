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
      <div className="flex mb-4 ">
        <div className="relative flex items-center">
          <div className="w-1/6 mr-4">
            <img
              src="https://previews.123rf.com/images/kurhan/kurhan1704/kurhan170400964/76701347-%ED%96%89%EB%B3%B5%ED%95%9C-%EC%82%AC%EB%9E%8C-%EC%96%BC%EA%B5%B4.jpg"
              alt="아저씨 이미지"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="max-w-md p-4 text-black bg-yellow-400 rounded-lg shadow-md">
            <p className="mb-2 text-2xl font-bold">마음에 드는 방이 없다면?</p>
            <button
              className="px-4 py-2 text-center text-white transition-colors duration-300 bg-yellow-600 rounded-lg shadow-lg hover:bg-yellow-700"
              onClick={handleCreateRoomClick}
            >
              방 생성
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <RoomList rooms={rooms} onRoomClick={handleRoomClick} />
      )}
    </div>
  );
};

export default MainPage;
