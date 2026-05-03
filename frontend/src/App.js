// frontend/src/App.js
// frontend/src/App.js
import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ModulePage from "./pages/ModulePage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";

// ─── Simple Auth Context ──────────────────────────────────────────────────────
export const AuthContext = React.createContext(null);

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mathquest_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    const userWithId = {
      ...userData,
      id: userData.id || Date.now(),
    };
    localStorage.setItem("mathquest_user", JSON.stringify(userWithId));
    setUser(userWithId);
  };

  const logout = () => {
    localStorage.removeItem("mathquest_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <Routes>
          {/* Login */}
          <Route
            path="/"
            element={!user ? <LoginPage /> : <Navigate to="/dashboard" />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/" />}
          />

          {/* Module Learning Page */}
          <Route
            path="/module/:moduleId"
            element={user ? <ModulePage /> : <Navigate to="/" />}
          />

          {/* ✅ GAME PAGE — standalone module-end game */}
          <Route
            path="/module/:moduleId/game"
            element={user ? <GamePage /> : <Navigate to="/" />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
