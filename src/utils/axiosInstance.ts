import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api", // Localhost for development
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent with requests
});

axiosInstance.interceptors.request.use((config) => {
  // Try multiple token storage keys for compatibility
  const token = localStorage.getItem("auth_token") || 
                localStorage.getItem("authToken") || 
                localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;


