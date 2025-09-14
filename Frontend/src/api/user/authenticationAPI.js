import userAxios from "../userAxios";


export const forgotPassword = (email) => {
  return userAxios.post("/auth/forgot-password", { email });
};

export const resendForgotPasswordOTP = (email) => {
  return userAxios.post("/auth/resend-forgot-password-otp", { email });
};

export const resendOtpForVerify = (email) => {
  return userAxios.post("/auth/resend-otp-verify", { email });
};

export const googleAuth = () => {
  return userAxios.get("/auth/google");
};

export const googleAuthCallback = () => {
  return userAxios.get("/auth/google/callback")
}