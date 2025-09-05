const setAuthCookies = (res, accessToken, refreshToken, type = "user") => {
  const accessCookieName = `accessToken_${type}`;
  const refreshCookieName = `refreshToken_${type}`;

  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 60 * 60 * 1000, 
  });

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });
};

export default setAuthCookies;
