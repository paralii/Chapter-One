import setAuthCookies from "../../utils/setAuthCookies.js";
import { logger } from "../../utils/logger.js";

export default function googleAuthCallback(req, res) {
  if (!req.user || !req.user.tokens) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const { accessToken, refreshToken } = req.user.tokens;

  setAuthCookies(res, accessToken, refreshToken, "user");

  const corsUrls = (process.env.CORS_URLS || "").split(",").map((u) => u.trim()).filter(Boolean);
  const baseFromEnv = process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim();
  const frontendBaseRaw = baseFromEnv || corsUrls[0] || "";
  const frontendBase = frontendBaseRaw.replace(/\/+$/, "");

  const redirectUrl = `${frontendBase}/login?auth=google`;

  logger.info(`Google auth successful, redirecting to frontend: ${redirectUrl}`);
  return res.redirect(redirectUrl);
}
