import React from "react";

interface TabBarProps {
  tabs: { label: string; id: string }[]; // 탭 데이터 타입 정의
  activeTabId: string; // 활성화된 탭 ID
  onTabClick: (tabId: string) => void; // 탭 클릭 이벤트 핸들러
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick }) => {
  const rainbowColors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-green-500",
    "text-blue-500",
    "text-purple-500",
  ];

  return (
    <div className="z-50 flex items-center justify-between border-b border-gray-200">
      {/* 왼쪽에 있는 버튼 */}
      <div>
        <button
          className="px-1 py-4 mt-10 text-6xl"
          onClick={() => onTabClick("main")}
        >
          {Array.from("천하제일 으랏차차 온라인 장기자랑").map(
            (char, index) => (
              <span
                key={index}
                className={`${
                  rainbowColors[index % rainbowColors.length]
                } mr-1 italic`}
              >
                {char}
              </span>
            )
          )}
        </button>
      </div>

      {/* 오른쪽에 있는 탭 목록 */}
      <nav className="flex space-x-4" aria-label="탭" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${
              activeTabId === tab.id
                ? "font-semibold border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-600 focus:text-blue-600"
            } py-4 px-1 inline-flex items-center gap-x-2 whitespace-nowrap focus:outline-none`}
            id={`tab-${tab.id}`}
            data-hs-tab={`#tab-panel-${tab.id}`}
            aria-controls={`tab-panel-${tab.id}`}
            role="tab"
            aria-selected={activeTabId === tab.id}
            onClick={() => onTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabBar;
