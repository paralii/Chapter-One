import STATUS_CODES from "../utils/constants/statusCodes.js";
import { errorLogger } from "../utils/logger.js";


export default function errorMiddleware  (err, req, res, next) {
  errorLogger.error("Unhandled Error", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    user: req.user ? req.user._id : null,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({
    error: "Internal Server Error",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? "🥞" : err.stack,
    details: process.env.NODE_ENV === "development" ? err : undefined,
    timestamp: new Date().toISOString(),
  });
};
