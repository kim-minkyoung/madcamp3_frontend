import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS 가져오기
import { Room, RoomService } from "../services/RoomService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabId, setActiveTabId] = useState(
    location.pathname.split("/")[1] || "main"
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setActiveTabId(location.pathname.split("/")[1] || "main");
  }, [location.pathname]);


  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId); // userId가 존재하면 true, 그렇지 않으면 false
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const userId = localStorage.getItem("userId");
      setIsLoggedIn(!!userId);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleTabClick = (tabId: string) => {
    console.log(`Tab clicked: ${tabId}`); // Debugging line
    setActiveTabId(tabId);
    navigate(`/${tabId}`);
  };

  const handleLoginClick = () => {
    const REST_API_KEY = process.env.REACT_APP_KAKAO_CLIENT_ID;
    const REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;
    window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  };

  // 탭 데이터
  const tabs = [
    { label: "방 찾기", id: "main" },
    { label: "랭킹 보기", id: "people" },
    { label: "마이페이지", id: "mypage" },
  ];

  return (
    <div className="flex justify-center font-ChosunGs">
      <div className="w-full px-32">
        <TabBar tabs={tabs} activeTabId={activeTabId} onTabClick={handleTabClick} />
        <div className="flex items-center justify-between mb-3">
          {!isLoggedIn && (
            <button
              className="mr-4 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700"
              onClick={handleLoginClick}
            >
              로그인
            </button>
          )}
        </div>
        <div className="mt-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
