import React from "react";
import { Room } from "../services/RoomService";
import {
  FaMicrophone,
  FaHatWizard,
  FaMusic,
  FaLaugh,
  FaHeadphones,
  FaGuitar,
  FaStar,
  FaQuestion,
} from "react-icons/fa";

const RoomListItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <div
    className="flex items-center justify-center p-4 mb-4 text-center transition-transform transform bg-white rounded-lg shadow-lg cursor-pointer hover:scale-105 hover:shadow-xl"
    onClick={onClick}
  >
    {children}
  </div>
);

interface RoomListProps {
  rooms: Room[];
  onRoomClick: (roomId: number) => void;
}

const iconStyle = { fontSize: "48px" };

const getIconForCategory = (category: string) => {
  switch (category) {
    case "노래":
      return <FaMicrophone style={iconStyle} className="text-rose-500" />;
    case "마술":
      return <FaHatWizard style={iconStyle} className="text-purple-500" />;
    case "춤":
      return <FaMusic style={iconStyle} className="text-green-500" />;
    case "코미디":
      return <FaLaugh style={iconStyle} className="text-yellow-500" />;
    case "성대모사":
      return <FaHeadphones style={iconStyle} className="text-blue-500" />;
    case "악기":
      return <FaGuitar style={iconStyle} className="text-orange-500" />;
    case "자유":
      return <FaStar style={iconStyle} className="text-pink-500" />;
    case "기타":
    default:
      return <FaQuestion style={iconStyle} className="text-gray-500" />;
  }
};

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => (
  <div className="grid grid-cols-4 gap-4">
    {rooms.map((room: Room) => (
      <RoomListItem
        key={room.room_id}
        onClick={() => onRoomClick(room.room_id)}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <div>{getIconForCategory(room.category)}</div>
            <div className="flex flex-col items-center ml-auto text-center">
              <div className="mb-1 text-2xl font-bold text-gray-800">
                {room.title}
              </div>
              <div className="text-lg text-gray-700">{room.sub_title}</div>
              <div className="italic text-gray-600 text-md">
                {room.category}
              </div>
              <div
                className={`text-lg px-3 py-1 rounded-full shadow-md ${
                  room.rank_mode
                    ? "bg-red-500 text-white animate-blink"
                    : "bg-green-300 text-gray-700"
                }`}
              >
                {room.rank_mode ? "랭크 모드" : "일반 모드"}
              </div>
            </div>
          </div>
        </div>
      </RoomListItem>
    ))}
  </div>
);

export default RoomList;
