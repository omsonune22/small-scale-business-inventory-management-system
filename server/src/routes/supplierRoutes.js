import { Router } from 'express';
import { getSuppliers, createSupplier, updateSupplier } from '../controllers/supplierController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/suppliers - Accessible to authenticated users
router.get('/', verifyToken, getSuppliers);

// Admin-only management
router.post('/', verifyToken, requireAdmin, createSupplier);
router.put('/:id', verifyToken, requireAdmin, updateSupplier);

export default router;
