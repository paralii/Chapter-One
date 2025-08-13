import { Server } from "socket.io";
import { logger } from "./logger.js";
let io;

const userSockets = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected:", socket.id);

    socket.on("registerUser", (userId) => {
      userSockets.set(userId, socket.id);
      logger.info(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
      for (let [userId, sockId] of userSockets.entries()) {
        if (sockId === socket.id) {
          userSockets.delete(userId);
          logger.info(`User ${userId} disconnected`);
        }
      }
    });
  });
};

export const forceLogoutUser = (userId) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit("forceLogout");
    logger.warn(`Force logout sent to user ${userId}`);
  }
};