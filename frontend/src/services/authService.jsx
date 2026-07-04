// frontend/src/services/authService.js

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token automatically to every outgoing request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("mathquest_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Debug: log every outgoing request
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Global response interceptor — surface backend error messages clearly
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API Error]", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * Register a new user
 * Calls: POST http://localhost:5000/api/auth/register
 */
export const register = async (data) => {
  console.log("🚀 FINAL API CALL:", "http://localhost:5000/api/auth/register");
  const res = await API.post("/auth/register", data);
  return res.data;
};
/**
 * Login with email + password
 * Calls: POST http://localhost:5000/api/auth/login
 */
export const login = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

/**
 * Fetch the logged-in user's profile
 * Calls: GET http://localhost:5000/api/user/profile
 */
export const getProfile = async () => {
  const res = await API.get("/user/profile");
  return res.data;
};

/**
 * Teacher analytics overview
 * Calls: GET http://localhost:5000/api/analytics/overview
 */
export const getAnalyticsOverview = async () => {
  const res = await API.get("/analytics/overview");
  return res.data;
};

/**
 * Teacher analytics students/modules data
 * Calls: GET http://localhost:5000/api/analytics/students
 */
export const getAnalyticsStudents = async () => {
  const res = await API.get("/analytics/students");
  return res.data;
};

export default API;

