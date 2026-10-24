import { Router } from 'express';
import { getLedger, adjustStock, getLowStockReport } from '../controllers/inventoryController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All inventory endpoints require authentication
router.use(verifyToken);

// GET /api/v1/inventory/ledger - View audit logs
router.get('/ledger', getLedger);

// GET /api/v1/inventory/low-stock-report - Calculate units needed for replenishment
router.get('/low-stock-report', getLowStockReport);

// POST /api/v1/inventory/adjust - Admin-only manual stock adjustments
router.post('/adjust', requireAdmin, adjustStock);

export default router;
