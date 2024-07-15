import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainPage from "./pages/rooms/MainPage";
import RoomPage from "./pages/rooms/RoomPage";
import PeoplePage from "./pages/PeoplePage";
import MyPage from "./pages/MyPage";
import Redirection from "./pages/Redirection";
import CreateRoomPage from "./pages/rooms/CreateRoomPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route path="kakao/callback" element={<Redirection />} />
          <Route path="create-room" element={<CreateRoomPage />} />
          <Route index element={<Navigate to="/main" />} />
          <Route path="main" element={<MainPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
