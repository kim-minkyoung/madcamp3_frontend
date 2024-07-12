import React, { useState } from "react";
import TabBar from "../components/TabBar";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap CSS 가져오기

const HomePage: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState("1");

  const handleTabClick = (tabId: string) => {
    console.log(`Tab clicked: ${tabId}`); // Debugging line
    setActiveTabId(tabId);
  };

  // 탭 데이터
  const tabs = [
    { id: "1", label: "탭 1" },
    { id: "2", label: "탭 2" },
    { id: "3", label: "탭 3" },
  ];

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-2xl">
        {/* TabBar 컴포넌트에 props 전달 */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
        />

        <div className="mt-3">
          {/* 각 탭 패널 */}
          {tabs.map((tab) => (
            <div
              key={`tab-panel-${tab.id}`}
              id={`tab-panel-${tab.id}`}
              className={`${
                activeTabId === tab.id ? "block" : "hidden"
              } text-gray-500`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
            >
              <p>
                이것은{" "}
                <span className="font-semibold text-gray-800">{tab.label}</span>{" "}
                탭의 내용입니다.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
