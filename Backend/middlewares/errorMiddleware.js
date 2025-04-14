export const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? "🥞" : err.stack,
  });
};
