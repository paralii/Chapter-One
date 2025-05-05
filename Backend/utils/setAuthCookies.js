const setAuthCookies = (res, accessToken, refreshToken, type = "user") => {
  const accessCookieName = `accessToken_${type}`;
  const refreshCookieName = `refreshToken_${type}`;

  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Lax",
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export default setAuthCookies;
