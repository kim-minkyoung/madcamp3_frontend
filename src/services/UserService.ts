import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

class UserService {
  // 전체 유저 랭킹 조회 (누적 점수 기준)
  async getAllUsersRanking() {
    const response = await axios.get(`${API_BASE_URL}/user`);
    return response.data;
  }

  // 개별 유저 정보 조회
  async getUserInfo(userId: string) {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  }

  // 장르별 랭킹 조회
  async getGenreRanking(genre: string) {
    const response = await axios.get(`${API_BASE_URL}/user/genre/${genre}`);
    return response.data;
  }

  // 유저 정보 수정
  async updateUserInfo(userId: string, userInfo: any) {
    const response = await axios.put(`${API_BASE_URL}/user/${userId}`, userInfo);
    return response.data;
  }
}

export default new UserService();
