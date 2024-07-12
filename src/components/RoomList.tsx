import React from "react";
import styled from "styled-components";

const RoomListContainer = styled.div`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-width: 400px;
`;

const RoomListItem = styled.div`
  cursor: pointer;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #f0f0f0;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e0e0e0;
  }
`;

interface Room {
  id: number;
  name: string;
  description: string;
}

interface RoomListProps {
  rooms: Room[];
  onRoomClick: (roomId: number) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => {
  return (
    <RoomListContainer>
      <h2>방 목록</h2>
      {rooms.map((room) => (
        <RoomListItem key={room.id} onClick={() => onRoomClick(room.id)}>
          <h3>{room.name}</h3>
          <p>{room.description}</p>
        </RoomListItem>
      ))}
    </RoomListContainer>
  );
};

export default RoomList;
