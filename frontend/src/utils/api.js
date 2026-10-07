import axios from "axios";
import { getToken, clearAuth } from "./auth";

// Falls back to localhost so the app still works if VITE_API_URL is not set
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected/expired, log the user out and go to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === "ERR_NETWORK")
    return "Cannot reach the server. Please check your connection or backend URL.";
  return fallback;
};

export default api;
