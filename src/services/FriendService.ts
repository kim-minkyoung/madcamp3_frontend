import axios from "axios";
import { User } from "./UserService";

const API_BASE_URL = process.env.REACT_APP_URL;

export class FriendService {
  async getFollowers(userId: string): Promise<User[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/friends/${userId}/follower`
      );
      const followers: User[] = response.data.map((user: any) => ({
        user_id: user.user_id,
        user_name: user.user_name,
        user_image: user.user_image,
      }));
      return followers;
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  }

  async getFollowings(userId: string): Promise<User[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/friends/${userId}/following`
      );
      const followings: User[] = response.data.map((user: any) => ({
        user_id: user.user_id,
        user_name: user.user_name,
        user_image: user.user_image,
      }));
      return followings;
    } catch (error) {
      console.error("Error fetching followings:", error);
      return [];
    }
  }

  async checkFollowing(userId: string, targetUserId: string): Promise<boolean> {
    try {
      if (!userId || !targetUserId) {
        throw new Error("Missing userId or targetUserId");
      }

      const response = await axios.get<boolean>(
        `${API_BASE_URL}/checkFollowing/${userId}/${targetUserId}`
      );

      return response.data;
    } catch (error) {
      console.error("Error checking following:", error);
      throw error; // 예외를 상위로 다시 던질 수 있습니다.
    }
  }

  async followUser(userId: string, followingId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/friends/${userId}/following`, {
        followingId: followingId,
      });
    } catch (error) {
      console.error("Error following user:", error);
    }
  }

  async unfollowUser(userId: string, followingId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/friends/${userId}/unfollow/${followingId}`
      );
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  }

  async blockFollower(userId: string, followerId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/friends/${userId}/block/${followerId}`
      );
    } catch (error) {
      console.error("Error blocking follower:", error);
    }
  }
}

export default new FriendService();
