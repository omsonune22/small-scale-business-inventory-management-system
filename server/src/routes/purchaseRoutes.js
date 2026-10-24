import { Router } from 'express';
import { createPurchase, getPurchases, getPurchaseById } from '../controllers/purchaseController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Purchase operations require authentication and Administrator authorization
router.use(verifyToken, requireAdmin);

// POST /api/v1/purchases - Inward intake with row locking & audit ledger
router.post('/', createPurchase);

// GET /api/v1/purchases - Paginated list of purchases
router.get('/', getPurchases);

// GET /api/v1/purchases/:id - Line item inspection
router.get('/:id', getPurchaseById);

export default router;
