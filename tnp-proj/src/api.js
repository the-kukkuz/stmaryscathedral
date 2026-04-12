// src/api.js
import axios from "axios";

<<<<<<< HEAD
<<<<<<< HEAD
const API_BASE = import.meta.env.VITE_API_URL + "/api";
=======
const API_BASE = "/api";
>>>>>>> 5e2b8a1 (railway config)
=======
const API_BASE = import.meta.env.VITE_API_URL + "/api";
>>>>>>> 98f619a (fixes)

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      if (window.location.pathname !== "/SignIn") {
        window.location.href = "/SignIn";
      }
    }
    return Promise.reject(error);
  }
);

export default API_BASE;
export { api };

export const getMembers = () => api.get("/members");
export const createMember = (memberData) => api.post("/members", memberData);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);

export const getFamilies = () => api.get("/families");
export const createFamily = (data) => api.post("/families", data);
