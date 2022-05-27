import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import LoginPage from "./pages/manager/login";
import RecoveryPage from "./pages/manager/passwordRecovery";
import ProfilePage from "./pages/user/profile";
import TestPage from "./pages/user/test";
import MembersPage from "./pages/manager/membersManagement";
import { AuthContextProvider } from "./context/authContext";

import "./App.css";
import Navbar from "./components/Navbar/Navbar";

function App() {
  return (
    <AuthContextProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recovery" element={<RecoveryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </AuthContextProvider>
  );
}

export default App;
