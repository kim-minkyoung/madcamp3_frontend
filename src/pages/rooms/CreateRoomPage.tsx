// src/pages/CreateRoomPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoomService, Room } from "../../services/RoomService";
import { create } from "domain";

const categories = ['노래', '마술', '춤', '코미디', '성대모사', '악기', '자유', '기타'];

const CreateRoomPage: React.FC = () => {
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomRank, setRoomRank] = useState("");
  const [roomCategory, setRoomCategory] = useState(categories[0]);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const roomService = new RoomService();
    const newRoom = {
      title: roomName,
      subTitle: roomDescription,
      rankMode: (roomRank === "true"),
      category: roomCategory,
      ownerId: localStorage.getItem("userId") || "",
    };

    try {
      const createdRoomId = await roomService.createRoom(newRoom);
      navigate(`/room/${createdRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-6">방 생성</h2>
    <form
        onSubmit={(e) => {
        e.preventDefault();
        handleCreateRoom();
        }}
    >
        <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">방 제목:</label>
        <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>
        <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">방 설명:</label>
        <input
            type="text"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>
        <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">랭크:</label>
        <select
            value={roomRank}
            onChange={(e) => setRoomRank(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <option value="true">랭크</option>
            <option value="false">일반</option>
        </select>
        </div>
        <div className="mb-4">
        <label className="block text-gray-700 font-bold mb-2">카테고리:</label>
        <select
            value={roomCategory}
            onChange={(e) => setRoomCategory(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {categories.map((category) => (
            <option key={category} value={category}>
                {category}
            </option>
            ))}
        </select>
        </div>
        <button
        type="submit"
        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
        방 생성
        </button>
    </form>
    </div>

  );
};

export default CreateRoomPage;
