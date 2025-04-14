import userAxios from "../userAxios";

export const signupUser = (userData) => {
  return userAxios.post("/signup", userData);
};

export const loginUser = (credentials) => {
  return userAxios.post("/login", credentials, { withCredentials: true });
};

export const logoutUser = () => {
  return userAxios.post("/logout", {}, { withCredentials: true });
};

export const forgotPassword = (email) => {
  return userAxios.post("/forgot-password", { email });
};

export const resetPassword = (data) => {
  return userAxios.post("/reset-password", data);
};

export default { signupUser, loginUser, logoutUser, forgotPassword, resetPassword };
