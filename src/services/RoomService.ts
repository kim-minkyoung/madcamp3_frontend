// services/RoomService.ts

export interface Room {
  id: number;
  name: string;
  description: string;
}

export const fetchRooms = async (): Promise<Room[]> => {
  // Simulating fetching data from a server (dummy data)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulating delay
  const data: Room[] = [
    { id: 1, name: "방 1", description: "방 1 설명" },
    { id: 2, name: "방 2", description: "방 2 설명" },
    { id: 3, name: "방 3", description: "방 3 설명" },
  ];
  return data;
};
