// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import connectDB from "./config/db.js";
import redisClient from "./utils/redisClient.js";
import { logger, errorLogger } from "./utils/logger.js";

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Connect DB & Redis, then start server
connectDB()
  .then(async () => {
    await redisClient.connect();
    logger.info("✅ Redis connected");

    app.listen(process.env.PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    errorLogger.error(`❌ Startup Error: ${err.message}`);
  });
