import { io } from "socket.io-client";
import store from "../redux/store";
import { logoutUser } from "../redux/authSlice";
import { toast } from "react-toastify";

const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });

export const registerSocket = (userId) => {
  socket.emit("registerUser", userId);

  socket.on("forceLogout", () => {
    store.dispatch(logoutUser());
    toast.error("Your account has been blocked by admin");
    window.location.href = "/";
  });
};

export default socket;
