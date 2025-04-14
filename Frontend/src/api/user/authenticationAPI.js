import userAxios from "../userAxios";

// Example: Google authentication redirect endpoint
export const googleAuth = () => {
  return userAxios.get("/auth/google");
};

export default { googleAuth };
