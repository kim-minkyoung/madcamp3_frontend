import React from "react";
import {Room} from "../services/RoomService";

const RoomListItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <div
    className="flex justify-between p-3 mb-3 transition-colors duration-300 bg-gray-100 rounded shadow-md cursor-pointer hover:bg-gray-200"
    onClick={onClick}
  >
    {children}
  </div>
);


interface RoomListProps {
  rooms: Room[];
  onRoomClick: (roomId: number) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => (
  <div>
    {rooms.map((room: Room) => (
      <RoomListItem key={room.room_id} onClick={() => onRoomClick(room.room_id)}>
        <div>
          <h3 className="mb-2 text-xl font-semibold">{room.title}</h3>
          <p className="text-gray-700">{room.sub_title}</p>
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
      </RoomListItem>
    ))}
  </div>
);

export default RoomList;
