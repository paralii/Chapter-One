//adminRoutes.js
import express from 'express';
import { adminSignIn } from '../controllers/adminController.js';

const router = express.Router();

// POST /api/admin/signin
router.post('/signin', adminSignIn);

export default router;