import { v4 as uuidv4 } from "uuid";

export const generateReferralCode = () => {
  return `CHAP1-${uuidv4().split("-")[0].toUpperCase()}`;
};
