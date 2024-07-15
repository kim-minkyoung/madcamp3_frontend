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
    className="flex items-center justify-center p-3 mb-3 text-center transition-colors duration-300 bg-gray-100 rounded shadow-md cursor-pointer hover:bg-gray-200"
    onClick={onClick}
  >
    {children}
  </div>
);


interface RoomListProps {
  rooms: Room[];
  onRoomClick: (roomId: number) => void;
}

const iconStyle = { fontSize: "48px" }; // 아이콘 크기를 48px로 설정

const getIconForCategory = (category: string) => {
  switch (category) {
    case "노래":
      return <FaMicrophone style={iconStyle} />;
    case "마술":
      return <FaHatWizard style={iconStyle} />;
    case "춤":
      return <FaMusic style={iconStyle} />;
    case "코미디":
      return <FaLaugh style={iconStyle} />;
    case "성대모사":
      return <FaHeadphones style={iconStyle} />;
    case "악기":
      return <FaGuitar style={iconStyle} />;
    case "자유":
      return <FaStar style={iconStyle} />;
    case "기타":
    default:
      return <FaQuestion style={iconStyle} />;
  }
};

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => (
  <div className="grid grid-cols-4 gap-4">
    {rooms.map((room: Room) => (

      <RoomListItem key={room.room_id} onClick={() => onRoomClick(room.room_id)}>
        <div className="items-center">
          <div className="mr-3">{getIconForCategory(room.category)}</div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">{room.title}</h3>
            <p className="text-gray-700">{room.sub_title}</p>
            <p className="text-gray-700">{room.category}</p>
          </div>
          <div
            className={`text-lg px-2 py-1 rounded ${
              room.rank_mode
                ? "bg-red-500 text-white"
                : "bg-green-300 text-gray-700"
            }`}
          >
            {room.rank_mode ? "랭크 모드" : "일반 모드"}
          </div>
        </div>
      </RoomListItem>
    ))}
  </div>
);

export default RoomList;
