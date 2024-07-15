import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_URL;

// User 인터페이스 정의
export interface User {
  user_id: string;
  user_name: string;
  user_image: string | null;
  user_gender: '남성' | '여성';
  bio: string | null;
  total_score: number;
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
    }));
    return users;
  }

  // 개별 유저 정보 조회
  async getUserInfo(userId: string): Promise<User> {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  }


  // 유저 정보 수정
  async updateUserInfo(userId: string, userInfo: Partial<User>): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/user/${userId}`, userInfo);
    return response.data;
  }
}

export default new UserService();
