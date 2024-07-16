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
import FriendService from "../services/FriendService";
import { on } from "events";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserProfile: React.FC<{
  user: User;
  onUpdateFollowers: () => void;
}> = ({ user, onUpdateFollowers }) => {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const userId = localStorage.getItem("userId") as string;

  useEffect(() => {
    // Fetch initial followers and following counts
    const fetchFollowCounts = async () => {
      try {
        const followers = await FriendService.getFollowers(user.user_id);
        const followings = await FriendService.getFollowings(user.user_id);
        const isFollowing = await FriendService.checkFollowing(userId, user.user_id);
        console.log(isFollowing);
        setIsFollowing(isFollowing);
        setFollowersCount(followers.length);
        setFollowingCount(followings.length);


      } catch (error) {
        console.error("Error fetching follow counts:", error);
      }
    };

    fetchFollowCounts();
  }, [user.user_id]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Unfollow the user
        await FriendService.unfollowUser(userId, user.user_id);
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        // Follow the user
        await FriendService.followUser(userId, user.user_id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
      onUpdateFollowers();
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const data = {
    labels: user.scores.map((score) => score.toString()),
    datasets: [
      {
        label: "점수",
        data: user.scores,
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
            팔로워: {followersCount}, 팔로잉: {followingCount}
          </div>
          <div className="text-sm text-gray-700">{user.bio}</div>
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
        <Bar
          data={data}
          options={{ responsive: true, scales: { y: { beginAtZero: true } } }}
        />
      </div>
    </div>
  );
};

export default UserProfile;
