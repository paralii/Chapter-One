import { createClient } from "redis";
import { logger, errorLogger } from "./logger.js";

const redisClient = createClient(
    {
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
            tls:true,
            reconnectStrategy: retries => {
                if (retries % 5 === 0) {
                    errorLogger.error(`Redis reconnect attempt #${retries}`);
                }
                return Math.min(retries * 100, 3000);
            }
        }
    }
);

redisClient.on("error", (err) => errorLogger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Redis connected"));
redisClient.on("reconnecting", () => logger.info("Redis reconnecting..."));
redisClient.on("ready", () => logger.info("Redis ready"));
redisClient.on("end", () => logger.info("Redis connection closed"));

setInterval(async () => {
    try {
        await redisClient.ping();
        logger.info("Redis ping successful");
    } catch (err) {
        errorLogger.error("Redis ping error", err);
    }
}, 20000);

export default redisClient;
