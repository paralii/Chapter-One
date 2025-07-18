export default function googleAuthCallback(req, res) {
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const { accessToken, refreshToken } = req.user.tokens;
  res.cookie("accessToken_user", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "Lax",
    maxAge: 60 * 60 * 1000, 
  });

  res.cookie("refreshToken_user", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(process.env.CORS_URL || "/");
};