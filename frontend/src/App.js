// frontend/src/App.jsx
// Role-based routing: students → /dashboard, teachers → /teacher-dashboard.
// All existing module/game routes preserved and protected.
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth system
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute                from "./components/common/ProtectedRoute";
import Login                         from "./pages/auth/Login";
import Register                      from "./pages/auth/Register";

// Pages
import Dashboard        from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ModulePage       from "./pages/ModulePage";
import GamePage         from "./pages/GamePage";

// ── Root redirect ─────────────────────────────────────────────────────────────
// "/" → authenticated users go to their role-specific dashboard, others to login.
const RootRedirect = () => {
  const { token, user } = React.useContext(AuthContext);
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === "teacher") return <Navigate to="/teacher-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public auth pages */}
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* Student-only routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/module/:moduleId"
          element={
            <ProtectedRoute allowedRole="student">
              <ModulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/module/:moduleId/game"
          element={
            <ProtectedRoute allowedRole="student">
              <GamePage />
            </ProtectedRoute>
          }
        />

        {/* Teacher-only routes */}
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all → root redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
