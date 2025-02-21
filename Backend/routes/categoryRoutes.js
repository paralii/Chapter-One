//categoryRoutes.js
import express from 'express';
import { addCategory, editCategory, deleteCategory, listCategories } from '../controllers/categoryController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protectAdmin, addCategory);
router.put('/:id', protectAdmin, editCategory);
router.delete('/:id', protectAdmin, deleteCategory);
router.get('/', protectAdmin, listCategories);

export default router;