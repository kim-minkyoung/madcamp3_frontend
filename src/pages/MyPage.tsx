import React, { useEffect, useState } from "react";
import UserProfile from "./UserProfile"; // UserProfile 컴포넌트의 경로에 따라 수정해주세요.
import userService, { User } from "../services/UserService";

const Tab3: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const user = await userService.getUserInfo(userId);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleUpdateFollowers = (userId: string, newFollowersCount: number) => {
    console.log(`Update followers for user ${userId} to ${newFollowersCount}`);
  };

  return (
    <div>
      {currentUser && (
        <UserProfile
          user={currentUser}
          onUpdateFollowers={handleUpdateFollowers}
        />
      )}
    </div>
  );
};

export default Tab3;
