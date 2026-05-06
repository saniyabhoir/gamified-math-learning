// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useCallback, useMemo } from "react";

export const AuthContext = createContext(null);

// Storage keys
const TOKEN_KEY = "mathquest_token";
const USER_KEY  = "mathquest_user";

/**
 * Decode the JWT payload without a library.
 * Returns null if decoding fails (invalid token).
 */
const decodeJWT = (token) => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialise from localStorage so sessions persist across page refreshes
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  /**
   * Called after a successful /api/auth/login response.
   * Decodes role from JWT and stores everything in state + localStorage.
   *
   * @param {string} tokenValue  - Raw JWT string
   * @param {object} userData    - User object returned by the API
   */
  const login = useCallback((tokenValue, userData) => {
    // Decode the JWT to extract role (in case API response is stale)
    const decoded = decodeJWT(tokenValue);
    const role = userData.role || decoded?.role || "student";

    const normalised = {
      id:       userData.id || userData._id,
      name:     userData.name,
      username: userData.name,   // legacy alias used by Dashboard
      email:    userData.email,
      role,
    };

    localStorage.setItem(TOKEN_KEY, tokenValue);
    localStorage.setItem(USER_KEY, JSON.stringify(normalised));
    setToken(tokenValue);
    setUser(normalised);
  }, []);

  /**
   * Clears all auth state and localStorage.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      // Convenience role helpers
      isStudent: user?.role === "student",
      isTeacher: user?.role === "teacher",
    }),
    [user, token, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
