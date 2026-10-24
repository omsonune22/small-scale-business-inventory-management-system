import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

import sanitizeInputs from './middleware/sanitize.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON body parser with generous limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Defensive XSS Sanitization Middleware
app.use(sanitizeInputs);

// 2. Health & System Diagnostic Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [dbCheck] = await pool.query('SELECT 1 as is_connected, NOW() as server_time');
    res.status(200).json({
      status: 'UP',
      service: 'Small Scale Business Inventory Management API',
      database: 'Connected (MySQL 8.0)',
      db_time: dbCheck[0]?.server_time,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'DEGRADED',
      database: 'Connection Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 3. API Routes (v1 & default prefixes)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/reports', reportRoutes);

// Compatibility aliases
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// 4. 404 Route Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// 5. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 6. Server Initialization
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[REST API]: Server active on http://localhost:${PORT}`);
  });
}

export default app;
