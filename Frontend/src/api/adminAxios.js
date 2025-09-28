import axios from "axios";
import store from "../redux/store";
import { refreshAdminSession, logoutAdmin } from "../redux/adminSlice";

const adminAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/admin`,
  withCredentials: true, 
});

adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await store.dispatch(refreshAdminSession());
        return adminAxios(originalRequest);
      } catch (err) {
        console.error("Session refresh failed:", err);
        store.dispatch(logoutAdmin());
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default adminAxios;
