import React from "react";

interface TabBarProps {
  tabs: { label: string; id: string }[]; // 탭 데이터 타입 정의
  activeTabId: string; // 활성화된 탭 ID
  onTabClick: (tabId: string) => void; // 탭 클릭 이벤트 핸들러
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabClick }) => {
  return (
    <div className="flex justify-between border-b border-gray-200">
      <nav className="flex items-center">
        <span className="py-4 px-1">fdf</span>
      </nav>
      <nav className="flex space-x-1" aria-label="탭" role="tablist">
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
