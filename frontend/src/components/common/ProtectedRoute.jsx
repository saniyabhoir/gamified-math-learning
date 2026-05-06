// frontend/src/components/common/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

/**
 * Wraps any route that requires authentication (and optionally a specific role).
 *
 * Props:
 *   children   - The protected page component
 *   allowedRole - Optional. "student" | "teacher". If omitted, any auth'd user passes.
 *
 * Behaviour:
 *   - No token → redirect to /login (preserving intended destination)
 *   - Wrong role → redirect to the correct dashboard for their role
 *   - Correct role → render children
 *
 * Usage in App.jsx:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute allowedRole="student"><Dashboard /></ProtectedRoute>
 *   } />
 *   <Route path="/teacher-dashboard" element={
 *     <ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, user } = useContext(AuthContext);
  const location = useLocation();

  // Not authenticated → send to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role restriction present AND user has wrong role
  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to the dashboard appropriate for their actual role
    const fallback = user?.role === "teacher" ? "/teacher-dashboard" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
