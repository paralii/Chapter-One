import adminAxios from "../adminAxios";

export const adminLogin = (credentials) => {
  return adminAxios.post("/login", credentials);
};

export const adminLogout = () => {
  return adminAxios.post("/logout");
};

export const refreshAdminToken = () => {
  return adminAxios.post("/refresh-token");
};
