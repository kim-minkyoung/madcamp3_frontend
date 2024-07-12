import React from "react";

const RoomListItem: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <div
    className="cursor-pointer p-3 mb-3 rounded shadow-md bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
    onClick={onClick}
  >
    {children}
  </div>
);

interface Room {
  id: number;
  name: string;
  description: string;
}

interface RoomListProps {
  rooms: Room[];
  onRoomClick: (roomId: number) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => (
  <div>
    {rooms.map((room: Room) => (
      <RoomListItem key={room.id} onClick={() => onRoomClick(room.id)}>
        <h3 className="font-semibold text-xl mb-2">{room.name}</h3>
        <p className="text-gray-700">{room.description}</p>
      </RoomListItem>
    ))}
  </div>
);

export default RoomList;
