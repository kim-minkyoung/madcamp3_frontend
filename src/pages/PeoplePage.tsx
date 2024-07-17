import React, { useState, useEffect } from "react";
import userService, { User } from "../services/UserService";
import UserProfile from "./UserProfile";

const Tab2: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users on component mount
  const fetchUsers = async () => {
    try {
      const usersData = await userService.getAllUsersRanking();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  useEffect(() => {
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
                      팔로워: {user.following ?? 0}, 팔로잉:
                      {user.followers ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.scores &&
                    user.scores.reduce((a, b) => a + b, 0) >= 3000 && (
                      <div className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
                        마술 달인
                      </div>
                    )}
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
          <UserProfile user={selectedUser} onUpdateFollowers={fetchUsers} />
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
