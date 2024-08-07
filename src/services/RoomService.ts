
import axios from 'axios';
import {User, UserService} from './UserService';

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

  async getRoomById(roomId: number): Promise<Room|null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/room/${roomId}`);
      const room: Room = {
        room_id: response.data[0].room_id,
        title: response.data[0].title,
        sub_title: response.data[0].sub_title,
        rank_mode: response.data[0].rank_mode,
        open: response.data[0].open,
        created_at: response.data[0].created_at,
        category: response.data[0].category,
        owner_id: response.data[0].owner_id,
      };
      console.log(room);
      return room;
    } catch (error) {
      console.error("Error fetching room:", error);
      return null;
    }
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
      console.log(`${API_BASE_URL}/room/${roomId}`);
      await axios.put(`${API_BASE_URL}/room/${roomId}`);
    } catch (error) {
      console.error("Error closing room:", error);
    }
  }

  async enterRoom(roomId: number, userId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/room/${roomId}/user`, { userId: userId });
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

  async getUserScoreInRoom(roomId: number, userId: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/room/${roomId}/${userId}/score`);
      return response.data[0].score;
    } catch (error) {
      console.error("Error fetching user score in room:", error);
      return 0;
    }
  }

  async updateScore(roomId: number, userId: string, score: number): Promise<void> {
    try {
      const userService = new UserService();
      const user = await userService.getUserInfo(userId);
      await axios.put(`${API_BASE_URL}/room/${roomId}/${userId}`, { score });
    } catch (error) {
      console.error("Error updating score:", error);
    }
  }

  async deleteUserInRoom(roomId: number, userId: string): Promise<void> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/room/${roomId}/${userId}`);
      console.log(response);
    } catch (error) {
      console.error("Error deleting user in room:", error);
    }
  }

  async updateTotalScores(roomId: number): Promise<void> {
    try {
      const roomUsers = await this.getAllUsersInRoom(roomId);
      for (const user of roomUsers) {
        const userScore = await this.getUserScoreInRoom(roomId, user.user_id);
        const userService = new UserService();
        const userDetail = await userService.getUserInfo(user.user_id);
        await userService.updateUserInfo(user.user_id, { total_score: userDetail.total_score + userScore });
      }
    } catch (error) {
      console.error("Error updating total scores:", error);
    }
  }
};

export default new RoomService();