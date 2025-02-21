//userRoutes.js
import express from 'express';
import { listUsers, blockUser, unblockUser } from '../controllers/userController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/admin/users?search=...&page=...&limit=...
router.get('/', protectAdmin, listUsers);

// PUT /api/admin/users/:id/block
router.put('/:id/block', protectAdmin, blockUser);

// PUT /api/admin/users/:id/unblock
router.put('/:id/unblock', protectAdmin, unblockUser);

export default router;