export enum RoomCategory {
  Singing = "노래",
  Magic = "마술",
  Dance = "춤",
  Comedy = "코미디",
  Mimicry = "성대모사",
  Instrument = "악기",
  Free = "자유",
  Other = "기타",
}

export interface Room {
  id: number;
  name: string;
  description: string;
  rank_mode: boolean;
  category: RoomCategory;
}

export const getAllOpenRooms = async (): Promise<Room[]> => {
  // Simulating fetching data from a server (dummy data)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulating delay
  const data: Room[] = [
    {
      id: 1,
      name: "방 1",
      description: "방 1 설명",
      rank_mode: false,
      category: RoomCategory.Singing,
    },
    {
      id: 2,
      name: "방 2",
      description: "방 2 설명",
      rank_mode: true,
      category: RoomCategory.Magic,
    },
    {
      id: 3,
      name: "방 3",
      description: "방 3 설명",
      rank_mode: false,
      category: RoomCategory.Dance,
    },
    {
      id: 4,
      name: "방 4",
      description: "방 4 설명",
      rank_mode: true,
      category: RoomCategory.Comedy,
    },
    {
      id: 5,
      name: "방 5",
      description: "방 5 설명",
      rank_mode: false,
      category: RoomCategory.Mimicry,
    },
    {
      id: 6,
      name: "방 6",
      description: "방 6 설명",
      rank_mode: true,
      category: RoomCategory.Instrument,
    },
    {
      id: 7,
      name: "방 7",
      description: "방 7 설명",
      rank_mode: false,
      category: RoomCategory.Free,
    },
    {
      id: 8,
      name: "방 8",
      description: "방 8 설명",
      rank_mode: true,
      category: RoomCategory.Other,
    },
    {
      id: 9,
      name: "방 9",
      description: "방 9 설명",
      rank_mode: false,
      category: RoomCategory.Singing,
    },
    {
      id: 10,
      name: "방 10",
      description: "방 10 설명",
      rank_mode: true,
      category: RoomCategory.Magic,
    },
    {
      id: 11,
      name: "방 11",
      description: "방 11 설명",
      rank_mode: false,
      category: RoomCategory.Dance,
    },
    {
      id: 12,
      name: "방 12",
      description: "방 12 설명",
      rank_mode: true,
      category: RoomCategory.Comedy,
    },
  ];
  return data;
};
