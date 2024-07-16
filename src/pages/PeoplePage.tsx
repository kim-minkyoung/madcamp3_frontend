import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import userService, { User } from "../services/UserService";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  const [imageStyle, setImageStyle] = useState<{
    width: string;
    height: string;
  }>({
    width: "100%",
    height: "100%",
  });

  useEffect(() => {
    // 이미지 비율 계산
    const aspectRatio = user.user_image
      ? getImageAspectRatio(user.user_image)
      : 1;
    if (aspectRatio !== 1) {
      // 비율이 1:1이 아닌 경우
      if (aspectRatio > 1) {
        // 가로가 긴 경우
        setImageStyle({ width: "auto", height: "100%" });
      } else {
        // 세로가 긴 경우
        setImageStyle({ width: "100%", height: "auto" });
      }
    }
  }, [user.user_image]);

  const getImageAspectRatio = (imageUrl: string | null) => {
    if (!imageUrl) return 1; // 이미지가 없을 경우 1:1 비율로 간주
    const img = new Image();
    img.src = imageUrl;
    return img.width / img.height;
  };

  const data = {
    labels: user.scores.map((score) => score.toString()),
    datasets: [
      {
        label: "점수",
        data: user.scores.map((score) => score),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // 카테고리별 점수 합산
  const categoryScores = {
    노래: 0,
    마술: 0,
    춤: 0,
    코미디: 0,
    성대모사: 0,
    악기: 0,
    자유: 0,
    기타: 0,
  };

  user.scores.forEach((score, index) => {
    const category =
      index < Object.keys(categoryScores).length
        ? (Object.keys(categoryScores)[index] as keyof typeof categoryScores)
        : "기타";
    categoryScores[category] += score;
  });

  return (
    <div className="p-6 bg-white rounded shadow-lg">
      <div
        className="flex items-center space-x-4"
        style={{ width: "100%", height: "auto" }}
      >
        <div
          style={{
            width: "4rem",
            height: "4rem",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <img
            style={{
              ...imageStyle,
              position: "relative",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            src={user.user_image || "default-image-url"}
            alt={user.user_name}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.user_name}</h2>
          <p className="text-sm text-gray-500">
            팔로워: {user.followers}, 팔로잉: {user.following}
          </p>
        </div>
      </div>
      <div className="flex mt-3">
        <h3 className="text-lg font-semibold text-gray-900">누적 점수: </h3>
        <p className="text-xl text-gray-700">{user.total_score}점</p>
      </div>
      <div className="">
        <h3 className="text-lg font-semibold text-gray-900">역대 점수 추이</h3>
        <Bar
          data={data}
          options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900">
          카테고리별 달인 여부
        </h3>
        <ul className="divide-y">
          {Object.entries(categoryScores).map(([category, score]) => (
            <li key={category} className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-700">{category}</span>
                <span
                  className={`text-lg ${
                    score >= 3000 ? "text-green-600 font-bold" : "text-gray-500"
                  }`}
                >
                  {score >= 3000 ? "달인" : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Tab2: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await userService.getAllUsersRanking();
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = async (userId: string) => {
    try {
      const user = await userService.getUserInfo(userId);
      setSelectedUser(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
      <div className="w-1/3 overflow-y-auto mr-14">
        <ul className="divide-y">
          {users.map((user) => (
            <li key={user.user_id} className="py-3 sm:py-4">
              <button
                onClick={() => handleUserSelect(user.user_id)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center space-x-4">
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                      src={user.user_image || "default-image-url"}
                      alt={user.user_name}
                    />
                  </div>
                  <div className="grid grid-rows-2 gap-y-1">
                    <span className="text-sm font-medium text-gray-900 text-start">
                      {user.user_name}
                    </span>
                    <span className="text-sm text-gray-500 text-start">
                      팔로워: {user.followers}, 팔로잉: {user.following}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                    {user.scores &&
                      user.scores.reduce((a, b) => a + b, 0) >= 3000 && (
                        <div className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                          마술 달인
                        </div>
                      )}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {user.total_score}점
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3 p-4 mr-10 overflow-y-auto bg-gray-100">
        {selectedUser ? (
          <UserProfile user={selectedUser} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            유저를 선택해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default Tab2;
