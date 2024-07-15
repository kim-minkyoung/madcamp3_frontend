import React from "react";

const Tab2: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "80vh" }}>
      <div className="w-3/12 overflow-y-auto mr-14">
        <ul role="list" className="divide-y">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((item) => (
            <li key={item} className="py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    className="w-8 h-8 rounded-full"
                    src="https://flowbite.com/docs/images/people/profile-picture-1.jpg"
                    alt="Neil image"
                  />
                  <div className="grid grid-rows-2 gap-y-1">
                    <span className="text-sm font-medium text-gray-900">
                      Neil Sims
                    </span>
                    <span className="text-sm text-gray-500">
                      팔로워: 100, 팔로잉: 100
                    </span>
                  </div>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  100점
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tab2;
