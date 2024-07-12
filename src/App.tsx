import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import MainPage from "./pages/MainPage";
import PeoplePage from "./pages/PeoplePage";
import MyPage from "./pages/MyPage";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />}>
          <Route index element={<Navigate to="/tab1" />} />
          <Route path="tab1" element={<MainPage />} />
          <Route path="tab2" element={<PeoplePage />} />
          <Route path="tab3" element={<MyPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
