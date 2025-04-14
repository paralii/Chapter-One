import jwt from "jsonwebtoken";

export const googleAuthCallback = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication failed" });
  }
  const { tokens } = req.user;

  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect(process.env.CORS_URL);
};
