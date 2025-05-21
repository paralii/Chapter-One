import axios from "axios";

const userAxios = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/user`,
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
          `${import.meta.env.VITE_API_BASE_URL}/user/refresh-token`,
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
