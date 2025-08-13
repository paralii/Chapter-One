import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import connectDB from "./config/db.js";
import redisClient from "./utils/redisClient.js";
import { logger, errorLogger } from "./utils/logger.js";

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { initSocket } from "./utils/socket.js";

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
    console.log("✅ Redis connected");

<<<<<<< HEAD
    const server = http.createServer(app);
    initSocket(server);

    server.listen(process.env.PORT, () => {
    logger.info(`Server running on http://localhost:${process.env.PORT}`);
=======
    app.listen(process.env.PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${process.env.PORT}`);
      console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    errorLogger.error(`❌ Startup Error: ${err.message}`);
    console.error(`❌ Startup Error: ${err.message}`);
>>>>>>> 8bd0e5f74c3d7bd13ad95e5416f2dd86d39e9eb6
  });
