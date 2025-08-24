import userAxios from "../userAxios";

export const getUserProfile = () => {
  return userAxios.get("/profile");
};

export const updateUserProfile = (profileData) => {
  return userAxios.put("/profile", profileData);
};

export const changeUserPassword = (oldPassword, newPassword) => {
  return userAxios.put("/profile/password", { oldPassword, newPassword });
};

export const uploadProfileImage = (formData) => {
  return userAxios.put("/profile/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const requestEmailChange = (newEmail) => {
  return userAxios.post("/profile/email/request", { newEmail });
};

export const resendOTP = (email) => {
  return userAxios.post("/profile/email/resend-otp", { email });
};

export const confirmEmailChange = ({otp, newEmail}) => {
  return userAxios.post("/profile/email/confirm", { otp, newEmail });
};
