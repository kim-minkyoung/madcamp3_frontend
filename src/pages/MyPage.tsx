import React, { useEffect, useState } from "react";
import UserProfile from "./UserProfile";
import userService, { User } from "../services/UserService";

const Tab3: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  useEffect(() => {
    fetchCurrentUser();
  }, []);


  return (
    <div>
      {currentUser && (
        <UserProfile
          user={currentUser}
          onUpdateFollowers={fetchCurrentUser}
        />
      )}
    </div>
  );
};

export default Tab3;
