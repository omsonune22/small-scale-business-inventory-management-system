import { Router } from 'express';
import { getMetrics, getLowStock, getRecentSales } from '../controllers/dashboardController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// All dashboard endpoints require a valid authenticated session
router.use(verifyToken);

// GET /api/v1/dashboard/metrics
router.get('/metrics', getMetrics);

// GET /api/v1/dashboard/low-stock
router.get('/low-stock', getLowStock);

// GET /api/v1/dashboard/recent-sales
router.get('/recent-sales', getRecentSales);

export default router;
