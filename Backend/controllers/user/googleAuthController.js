export default function googleAuthCallback (req, res)  {
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const { accessToken, refreshToken } = req.user.tokens;
  const user = req.user;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development", 
    sameSite: "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.redirect(process.env.CORS_URL || "/"); 
};
