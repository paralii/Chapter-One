import mongoose from "mongoose";
import { logger, errorLogger } from "../utils/logger.js";


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    errorLogger.error("MongoDB connection error", error);
    process.exit(1); // Exit process on DB connection failure
  }
};

export default connectDB;
