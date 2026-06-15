import axios from "axios";

const API = axios.create({
  baseURL: "https://smartnest-production-fe64.up.railway.app/api",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;