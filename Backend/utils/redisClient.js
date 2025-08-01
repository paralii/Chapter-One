import { createClient } from "redis";

const redisClient = createClient(
    {
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
            tls:true
        }
    }
);

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export default redisClient;
