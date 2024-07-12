import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import TabBar from "../components/TabBar";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS 가져오기

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTabId, setActiveTabId] = useState(
    location.pathname.split("/")[1] || "tab1"
  );

  useEffect(() => {
    setActiveTabId(location.pathname.split("/")[1] || "tab1");
  }, [location.pathname]);

  const handleTabClick = (tabId: string) => {
    console.log(`Tab clicked: ${tabId}`); // Debugging line
    setActiveTabId(tabId);
    navigate(`/${tabId}`);
  };

  // 탭 데이터
  const tabs = [
    { id: "tab1", label: "탭 1" },
    { id: "tab2", label: "탭 2" },
    { id: "tab3", label: "탭 3" },
  ];

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-2xl">
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
