// src/pages/CreateRoomPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoomService, Room } from "../../services/RoomService";
import { create } from "domain";

const categories = [
  "노래",
  "마술",
  "춤",
  "코미디",
  "성대모사",
  "악기",
  "자유",
  "기타",
];

const CreateRoomPage: React.FC = () => {
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomRank, setRoomRank] = useState("1");
  const [roomCategory, setRoomCategory] = useState(categories[0]);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const roomService = new RoomService();
    const newRoom = {
      title: roomName,
      subTitle: roomDescription,
      rankMode: roomRank,
      category: roomCategory,
      ownerId: localStorage.getItem("userId") || "",
    };

    try {
      console.log("Sending room data to server:", newRoom);
      await roomService.createRoom(newRoom);
      navigate(`/main`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold">방 생성</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateRoom();
        }}
      >
        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-700">방 제목:</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-700">방 설명:</label>
          <input
            type="text"
            value={roomDescription}
            onChange={(e) => setRoomDescription(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-700">모드:</label>
          <select
            value={roomRank}
            onChange={(e) => setRoomRank(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">랭크 모드</option>
            <option value="0">일반 모드</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-700">
            카테고리:
          </label>
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
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          방 생성
        </button>
      </form>
    </div>
  );
};

export default CreateRoomPage;
