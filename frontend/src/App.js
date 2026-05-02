// frontend/src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ModulePage from "./pages/ModulePage";
import LoginPage from "./pages/LoginPage";

// ─── Simple Auth Context ──────────────────────────────────────────────────────
export const AuthContext = React.createContext(null);

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("mathquest_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData) => {
    localStorage.setItem("mathquest_user", JSON.stringify(userData));
    setUser(userData);
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

        {/* ✅ MODULE PAGE (IMPORTANT) */}
        <Route
          path="/module/:moduleId"
          element={user ? <ModulePage /> : <Navigate to="/" />}
        />

        {/* (Optional) Game route */}
        <Route
          path="/module/:moduleId/game/:gameId"
          element={
            user ? (
              <div style={{ color: "white", padding: "20px" }}>
                🎮 Game coming soon!
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </Router>
  </AuthContext.Provider>
);
};

export default App;