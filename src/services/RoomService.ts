
import axios from 'axios';
import {User} from './UserService';

const API_BASE_URL = process.env.REACT_APP_URL;

export interface Room {
  room_id: number;
  title: string;
  sub_title: string;
  rank_mode: boolean;
  open: boolean;
  created_at: string;
  category: string;
  owner_id: string;  
}

export class RoomService {
  async getAllOpenRooms(): Promise<Room[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/room/open`);
      const rooms: Room[] = response.data.map((room: any) => ({
        room_id: room.room_id,
        title: room.title,
        sub_title: room.sub_title,
        rank_mode: room.rank_mode,
        open: room.open,
        created_at: room.created_at,
        category: room.category,
        owner_id: room.owner_id,
      }));
      return rooms;
    }
    catch (error) {
      console.error("Error fetching rooms:", error);
      return [];
    };
  }

  async createRoom(room: Partial<Room>): Promise<string|null> {
    try {
      console.log(`${API_BASE_URL}/room`);
      const response = await axios.post(`${API_BASE_URL}/room`, room);
      return response.data.room_id;
    
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  }

  async deleteRoom(roomId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/room/${roomId}`);
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }

  async closeRoom(roomId: number): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/room/${roomId}`);
    } catch (error) {
      console.error("Error closing room:", error);
    }
  }

  async enterRoom(roomId: number, userId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/room/${roomId}/enter`, { user_id: userId });
    } catch (error) {
      console.error("Error entering room:", error);
    }
  }

  async getAllUsersInRoom(roomId: number): Promise<User[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/room/${roomId}/user`);
      const users: User[] = response.data.map((user: any) => ({
        user_id: user.user_id,
        user_name: user.user_name,
        user_image: user.user_image,
      }));
      return users;
    } catch (error) {
      console.error("Error fetching users in room:", error);
      return [];
    }
  }

  async updateScore(roomId: number, userId: string, score: number): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/room/${roomId}/${userId}`, { score });
    } catch (error) {
      console.error("Error updating score:", error);
    }
  }

  async deleteUserInRoom(roomId: number, userId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/room/${roomId}/${userId}`);
    } catch (error) {
      console.error("Error deleting user in room:", error);
    }
  }
};

export default new RoomService();