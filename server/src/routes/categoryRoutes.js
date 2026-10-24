import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/categories - Open to all authenticated users
router.get('/', verifyToken, getCategories);

// POST /api/v1/categories - Restricted to Administrator
router.post('/', verifyToken, requireAdmin, createCategory);

export default router;
