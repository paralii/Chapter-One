
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development",
    sameSite: "Lax",
    maxAge: 60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default setAuthCookies;
