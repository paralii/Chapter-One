import userAxios from "../userAxios";

export const getUserProfile = () => {
  return userAxios.get("/user/profile");
};

export const updateUserProfile = (profileData) => {
  return userAxios.put("/user/profile", profileData);
};

export const requestEmailChange = (newEmail) => {
  return userAxios.post("/user/request-email-change", { newEmail });
};


export const changeUserPassword = (oldPassword, newPassword) => {
    return userAxios.put("/user/change-password", { oldPassword, newPassword });
  };

export default {
  getUserProfile,
  updateUserProfile,
  requestEmailChange,
    changeUserPassword,
};
