//server.js
import express from 'express';
import dotenv from 'dotenv';
import mongoose, { connect } from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

//Routes
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';

import connectDB from './config/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Route setup
app.use('/admin', adminRoutes);
app.use('/admin/users', userRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/products', productRoutes);
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));