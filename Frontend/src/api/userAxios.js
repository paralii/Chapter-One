import axios from "axios";
import { toast } from "react-toastify";
import { logoutUser } from "../redux/authSlice";
import store from "../redux/store.js";

const userAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/user`,
  withCredentials: true,
});

userAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if(error.response?.status === 403 && error.response.data.message === "Blocked account") {
      store.dispatch(logoutUser());
      toast.error("Your account has been blocked by admin");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    if (
      (error.response?.status === 401) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        return userAxios(originalRequest);
      } catch (refreshError) {
        setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default userAxios;
