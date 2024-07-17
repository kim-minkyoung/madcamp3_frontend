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
import UserService, { User } from "../services/UserService";
import FriendService from "../services/FriendService";
import Modal from "react-modal";
import "../UserProfile.css";
import { FaEdit, FaSave } from "react-icons/fa";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0)", // Transparent overlay
    zIndex: 1000,
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "10px",
    padding: "20px",
    maxWidth: "500px",
    width: "90%",
  },
};

const UserProfile: React.FC<{
  user: User;
  onUpdateFollowers: () => void;
}> = ({ user, onUpdateFollowers }) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [followers, setFollowers] = useState<User[]>([]);
  const [followings, setFollowings] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<"followers" | "followings">(
    "followers"
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chartData, setChartData] = useState<any>(null); // Initialize chartData state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(user.bio); // Initialize with current bio

  const userId = localStorage.getItem("userId") as string;

  useEffect(() => {
    const fetchFollowCounts = async () => {
      try {
        const followers = await FriendService.getFollowers(user.user_id);
        const followings = await FriendService.getFollowings(user.user_id);
        const isFollowing = await FriendService.checkFollowing(
          userId,
          user.user_id
        );
        setIsFollowing(isFollowing);
        setFollowersCount(followers.length);
        setFollowingCount(followings.length);
      } catch (error) {
        console.error("Error fetching follow counts:", error);
      }
    };

    fetchFollowCounts();
  }, [user.user_id, userId]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await UserService.getUserInfo(user.user_id);
        const scores = userData.scores || [];

        // userData.scores 배열에서 각 객체의 category와 date 속성을 조합하여 labels 배열 생성
        const labels = scores.map((scoreObj: any) => {
          const date = new Date(scoreObj.date);
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          return `${scoreObj.category} (${formattedDate})`;
        });

        const data = {
          labels: labels,
          datasets: [
            {
              label: "Scores",
              data: scores.map((scoreObj: any) => scoreObj.score),
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        };
        setChartData(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserData();
  }, [userId, user.scores]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await FriendService.unfollowUser(userId, user.user_id);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        await FriendService.followUser(userId, user.user_id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
      onUpdateFollowers();
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleFollowersClick = async () => {
    try {
      const followers = await FriendService.getFollowers(user.user_id);
      setFollowers(followers);
      setModalContent("followers");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const handleFollowingsClick = async () => {
    try {
      const followings = await FriendService.getFollowings(user.user_id);
      setFollowings(followings);
      setModalContent("followings");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching followings:", error);
    }
  };

  const handleUserClick = async (userId: string) => {
    try {
      const user = await UserService.getUserInfo(userId);
      setSelectedUser(user);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

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

  const handleSaveBio = async () => {
    try {
      // Send request to update bio
      const updatedUser = await UserService.updateUserInfo(userId, {
        bio: newBio,
      });

      setNewBio(newBio);

      setIsEditingBio(false); // Exit editing mode
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

  // Render only when chartData is not null or undefined
  return (
    <div className="p-6 bg-white rounded shadow-lg">
      <div className="flex items-center space-x-4">
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
              width: "100%",
              height: "100%",
              position: "absolute",
              objectFit: "cover",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            src={user.user_image || "default-image-url"}
            alt={user.user_name}
          />
        </div>
        <div className="flex flex-col flex-1">
          <div className="text-xl font-bold text-gray-900">
            {user.user_name}
          </div>
          <div className="text-sm text-gray-500">
            <span onClick={handleFollowersClick} style={{ cursor: "pointer" }}>
              팔로워: {followersCount}
            </span>
            ,{" "}
            <span onClick={handleFollowingsClick} style={{ cursor: "pointer" }}>
              팔로잉: {followingCount}
            </span>
          </div>
          <div className="flex">
            <div className="text-sm text-gray-700">
              <div className="text-sm text-gray-700">
                {isEditingBio ? (
                  <textarea
                    value={newBio || ""}
                    onChange={(e) => setNewBio(e.target.value)}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                ) : (
                  <div>
                    {localStorage.getItem("userId") === user.user_id
                      ? newBio || user.bio
                      : user.bio}
                  </div>
                )}
              </div>
            </div>
            {localStorage.getItem("userId") === user.user_id && (
              <div>
                {isEditingBio ? (
                  <button
                    className="flex items-center px-2 text-gray-700"
                    onClick={handleSaveBio}
                  >
                    <FaSave className="mr-2" />
                  </button>
                ) : (
                  <button
                    className="flex items-center px-2 text-gray-700 "
                    onClick={() => setIsEditingBio(true)}
                  >
                    <FaEdit className="mr-2" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {localStorage.getItem("userId") !== user.user_id && (
          <div>
            <button
              className="px-4 py-2 text-gray-400 border border-gray-400 rounded-lg"
              style={{
                color: isFollowing ? "gray" : "white",
                backgroundColor: isFollowing ? "transparent" : "#3498db",
                borderColor: isFollowing ? "#FF6347" : "#3498db",
              }}
              onClick={handleFollowToggle}
            >
              {isFollowing ? "팔로우 취소" : "팔로우"}
            </button>
          </div>
        )}
      </div>
      <div className="flex mt-3">
        <h3 className="text-lg font-semibold text-gray-900">누적 점수: </h3>
        <p className="text-xl text-gray-700">{user.total_score}점</p>
      </div>
      <div className="">
        <h3 className="text-lg font-semibold text-gray-900">역대 점수 추이</h3>
        {chartData && (
          <Bar
            data={chartData}
            options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            style={{
              cursor: "pointer",
              backgroundColor: "transparent",
              border: "none",
            }}
            onClick={closeModal}
          >
            X
          </button>
        </div>
        {selectedUser ? (
          <UserProfile
            user={selectedUser}
            onUpdateFollowers={onUpdateFollowers}
          />
        ) : (
          <>
            <h4>
              {modalContent === "followers" ? "팔로워 목록" : "팔로잉 목록"}
            </h4>
            <ul>
              {(modalContent === "followers" ? followers : followings).map(
                (user) => (
                  <li
                    key={user.user_id}
                    onClick={() => handleUserClick(user.user_id)}
                    style={{ cursor: "pointer" }}
                  >
                    {user.user_name}
                  </li>
                )
              )}
            </ul>
          </>
        )}
      </Modal>
    </div>
  );
};

export default UserProfile;
