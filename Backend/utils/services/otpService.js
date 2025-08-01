import redisClient from "../redisClient.js";
import { OTP_EXPIRY_SECONDS } from "../constants/constants.js";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOtpInRedis = async (key, otp) => {
  await redisClient.setEx(key, OTP_EXPIRY_SECONDS, otp);
};

export const getOtpFromRedis = async (key) => {
  return await redisClient.get(key);
};

export const deleteOtpFromRedis = async (key) => {
  await redisClient.del(key);
};
