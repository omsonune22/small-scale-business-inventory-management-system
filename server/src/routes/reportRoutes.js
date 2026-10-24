import { Router } from 'express';
import { 
  getSalesSummary, 
  getTopProducts, 
  getInventoryValuation, 
  exportCsv 
} from '../controllers/reportController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Business intelligence reports are strictly Admin Protected
router.use(verifyToken, requireAdmin);

// 1. Sales Summary Aggregations
router.get('/sales-summary', getSalesSummary);

// 2. Top-Selling Products & Gross Profit
router.get('/top-products', getTopProducts);

// 3. Complete Inventory Valuation & Category Breakdown
router.get('/inventory-valuation', getInventoryValuation);

// 4. Report CSV Export Stream / Download
router.get('/export-csv', exportCsv);

export default router;
