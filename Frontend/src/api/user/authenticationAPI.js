import userAxios from "../userAxios";

export const googleAuth = () => {
  return userAxios.get("/auth/google");
};

export default { googleAuth };
