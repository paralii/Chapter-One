import userAxios from "../userAxios";

export const getUserProfile = () => {
  return userAxios.get("/profile");
};


export const updateUserProfile = (profileData) => {
  return userAxios.put("/profile", profileData);
};

export const changeUserPassword = (oldPassword, newPassword) => {
  return userAxios.put("/profile/change-password", { oldPassword, newPassword });
};

export const uploadProfileImage = (formData) => {
  return userAxios.put("/profile/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const requestEmailChange = (newEmail) => {
  return userAxios.post("/profile/request-email-change", { newEmail });
};

export const resendOTP = (email) => {
  return userAxios.post("/profile/resend-otp", { email });
};

export const confirmEmailChange = ({otp, newEmail}) => {
  return userAxios.post("/profile/confirm-email-change", { otp, newEmail });
};
