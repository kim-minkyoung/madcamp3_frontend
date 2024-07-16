import React, { useState } from "react";
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

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ScoreHistory = {
  field: string;
  score: number;
};

type User = {
  id: number;
  name: string;
  followers: number;
  following: number;
  score: number;
  totalScore: number;
  scoreHistory: ScoreHistory[];
  imgSrc: string;
};

const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  const data = {
    labels: user.scoreHistory.map((history) => history.field),
    datasets: [
      {
        label: "점수",
        data: user.scoreHistory.map((history) => history.score),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6 bg-white rounded shadow-lg">
      <div className="flex items-center space-x-4">
        <img
          className="w-16 h-16 rounded-full"
          src={user.imgSrc}
          alt={user.name}
        />
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">
            팔로워: {user.followers}, 팔로잉: {user.following}
          </p>
        </div>
      </div>
      <div className="flex mt-3">
        <h3 className="text-lg font-semibold text-gray-900">누적 점수: </h3>
        <p className="text-xl text-gray-700">{user.totalScore}점</p>
      </div>
      <div className="">
        <h3 className="text-lg font-semibold text-gray-900">역대 점수 추이</h3>
        <Bar
          data={data}
          options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
        />
      </div>
    </div>
  );
};

const Tab2: React.FC = () => {
  const users: User[] = [
    {
      id: 1,
      name: "Neil Sims",
      followers: 100,
      following: 100,
      score: 100,
      totalScore: 1000,
      scoreHistory: [
        { field: "마술", score: 80 },
        { field: "요리", score: 85 },
        { field: "테니스", score: 90 },
        { field: "골프", score: 95 },
        { field: "독서", score: 100 },
        // 추가 데이터...
      ],
      imgSrc: "https://flowbite.com/docs/images/people/profile-picture-1.jpg",
    },
    {
      id: 2,
      name: "Jane Doe",
      followers: 200,
      following: 150,
      score: 95,
      totalScore: 900,
      scoreHistory: [
        { field: "요리", score: 70 },
        { field: "테니스", score: 75 },
        { field: "골프", score: 80 },
        { field: "독서", score: 85 },
        { field: "수영", score: 95 },
        // 추가 데이터...
      ],
      imgSrc: "https://flowbite.com/docs/images/people/profile-picture-2.jpg",
    },
    // 추가 유저 데이터...
  ];

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
      <div className="w-1/3 overflow-y-auto mr-14">
        <ul className="divide-y">
          {users.map((user) => (
            <li key={user.id} className="py-3 sm:py-4">
              <button
                onClick={() => setSelectedUser(user)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center space-x-4">
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.imgSrc}
                    alt={user.name}
                  />
                  <div className="grid grid-rows-2 gap-y-1">
                    <span className="text-sm font-medium text-gray-900 text-start">
                      {user.name}
                    </span>
                    <span className="text-sm text-gray-500 text-start">
                      팔로워: {user.followers}, 팔로잉: {user.following}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                    마술 달인
                  </div>
                  <div className="font-semibold text-gray-900">
                    {user.totalScore}점
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
