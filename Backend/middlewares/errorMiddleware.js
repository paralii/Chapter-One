import STATUS_CODES from "../utils/constants/statusCodes.js";

export default function errorMiddleware  (err, req, res, next) {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err);
  }

  res.status(STATUS_CODES.SERVER_ERROR.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? "🥞" : err.stack,
  });
};
