import Admin from "../../models/Admin.js";
import bcrypt from "bcryptjs";
import {
  generateTokens,
  refreshAccessToken,
} from "../../utils/auth/generateTokens.js";
import setAuthCookies from "../../utils/setAuthCookies.js";
import STATUS_CODES from "../../utils/constants/statusCodes.js";
import { validationMessages } from "../../utils/validationMessages/admin.js";

export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    const error = new Error(validationMessages.adminAuth.missingCredentials);
    error.statusCode = STATUS_CODES.CLIENT_ERROR.BAD_REQUEST;
    throw error;
  }

  try {
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin || !admin.isAdmin) {
      const error = new Error(validationMessages.adminAuth.notAdmin);
      error.statusCode = STATUS_CODES.CLIENT_ERROR.BAD_REQUEST;
      throw error;
    }

    const isMatch = await bcrypt.compare(normalizedPassword, admin.password);
    if (!isMatch) {
      const error = new Error(validationMessages.adminAuth.incorrectPassword);
      error.statusCode = STATUS_CODES.CLIENT_ERROR.BAD_REQUEST;
      throw error;
      
    }

    const { accessToken, refreshToken } = generateTokens(admin, true);

    setAuthCookies(res, accessToken, refreshToken, "admin");
    res
      .status(STATUS_CODES.SUCCESS.OK)
      .json({ admin, message: validationMessages.adminAuth.loginSuccess });
  } catch (err) {
    next(err);
  }
};

export const adminLogout = (req, res) => {
  res.clearCookie("accessToken_admin");
  res.clearCookie("refreshToken_admin");
  res
    .status(STATUS_CODES.SUCCESS.OK)
    .json({ message: validationMessages.adminAuth.logoutSuccess });
};

export const refreshAdminToken = (req, res) =>
  refreshAccessToken(req, res, "admin");
