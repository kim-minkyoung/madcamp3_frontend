import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS 가져오기

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabId, setActiveTabId] = useState(
    location.pathname.split("/")[1] || "main"
  );

  useEffect(() => {
    setActiveTabId(location.pathname.split("/")[1] || "main");
  }, [location.pathname]);

  const handleTabClick = (tabId: string) => {
    console.log(`Tab clicked: ${tabId}`); // Debugging line
    setActiveTabId(tabId);
    navigate(`/${tabId}`);
  };

  // 탭 데이터
  const tabs = [
    { label: "방 찾기", id: "main" },
    { label: "랭킹 보기", id: "people" },
    { label: "마이페이지", id: "mypage" },
  ];

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full px-32">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
        />
        <div className="mt-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
