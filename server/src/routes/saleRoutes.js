import { Router } from 'express';
import { createSale, getSaleById, getSales } from '../controllers/saleController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// POS sales are accessible to both Cashier Staff and Admin
router.use(verifyToken);

// POST /api/v1/sales - Strict ACID Checkout with row locking
router.post('/', createSale);

// GET /api/v1/sales - List recent sales orders
router.get('/', getSales);

// GET /api/v1/sales/:id - Complete invoice line item inspection
router.get('/:id', getSaleById);

export default router;
