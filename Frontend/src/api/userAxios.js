//api/userAxios.js
import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const userAxios = axios.create({
  baseURL: `${API_BASE}/user`,
  withCredentials: true,
});

userAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${API_BASE}/user/refresh-token`,
          {},
          { withCredentials: true }
        );
        return userAxios(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default userAxios;
