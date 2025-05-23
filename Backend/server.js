import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import connectDB from './config/db.js';

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";

import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();


app.use(express.json());
app.use(cors({ origin: process.env.CORS_URL, credentials: true,   allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser());
app.use(passport.initialize());


app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

app.use(errorMiddleware);

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
  });
});
