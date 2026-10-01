import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        // Clear token if invalid or expired
        if (error.response.data?.code === "TOKEN_EXPIRED" || error.response.data?.code === "INVALID_TOKEN") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
