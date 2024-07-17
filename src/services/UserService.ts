import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_URL;

// User 인터페이스 정의
export interface User {
  user_id: string;
  user_name: string;
  user_image: string | null;
  user_gender: "남성" | "여성";
  bio: string | null;
  total_score: number;
  followers: number; // 팔로워 수
  following: number; // 팔로잉 수
  scores: number[]; // 점수 기록 배열
}

export class UserService {
  // 전체 유저 랭킹 조회 (누적 점수 기준)
  async getAllUsersRanking(): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/user`);
    const users: User[] = response.data.map((user: any) => ({
      user_id: user.user_id,
      user_name: user.user_name,
      user_image: user.user_image,
      user_gender: user.user_gender,
      bio: user.bio,
      total_score: user.total_score,
      followers: user.follower_count,
      following: user.following_count,
    }));
    return users;
  }

  // 개별 유저 정보 조회
  async getUserInfo(userId: string): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    const user: User = {
      user_id: response.data.user_id,
      user_name: response.data.user_name,
      user_image: response.data.user_image,
      user_gender: response.data.user_gender,
      bio: response.data.bio,
      total_score: response.data.total_score || 0,
      following: response.data.following || 0,
      followers: response.data.followers || 0,
      scores: response.data.scores || 0,
    };
    return response.data;
  }

  // 유저 정보 수정
  async updateUserInfo(userId: string, userInfo: Partial<User>): Promise<User> {
    console.log(userInfo.total_score);
    const response = await axios.put(
      `${API_BASE_URL}/user/${userId}`,
      userInfo
    );
    return response.data;
  }
}

export default new UserService();
