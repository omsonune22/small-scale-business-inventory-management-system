import { query, withTransaction } from '../config/db.js';

// In-memory fallback product catalog for development/offline mode
let fallbackProducts = [
  { product_id: 1, category_id: 1, category_name: 'Beverages', sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', cost_price: 0.75, selling_price: 1.50, current_stock: 60, min_stock_threshold: 15, is_active: 1, created_at: '2026-10-23' },
  { product_id: 2, category_id: 1, category_name: 'Beverages', sku: 'BEV-OJ-1L', name: '100% Pure Orange Juice 1L', cost_price: 1.80, selling_price: 3.25, current_stock: 9, min_stock_threshold: 10, is_active: 1, created_at: '2026-10-23' },
  { product_id: 3, category_id: 2, category_name: 'Packaged Foods', sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', cost_price: 1.10, selling_price: 2.40, current_stock: 45, min_stock_threshold: 12, is_active: 1, created_at: '2026-10-23' },
  { product_id: 4, category_id: 2, category_name: 'Packaged Foods', sku: 'SNK-COOK-OAT', name: 'Oatmeal Raisin Baked Cookies 200g', cost_price: 1.50, selling_price: 3.00, current_stock: 6, min_stock_threshold: 8, is_active: 1, created_at: '2026-10-23' },
  { product_id: 5, category_id: 3, category_name: 'Personal Care', sku: 'PC-SOAP-ALOE', name: 'Moisturizing Aloe Vera Bar Soap 125g', cost_price: 0.90, selling_price: 2.00, current_stock: 0, min_stock_threshold: 10, is_active: 1, created_at: '2026-10-23' },
];

/**
 * GET /api/v1/products
 * Server-side pagination, search, and dynamic filtering.
 * Query Params: ?page=1&limit=10&search=&category_id=&stock_status=all|low|out
 */
export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim() : '';
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const stockStatus = req.query.stock_status || 'all';

    // Build Dynamic SQL Query
    const whereConditions = ['p.is_active = 1'];
    const params = [];

    // Search filter
    if (search) {
      whereConditions.push('(p.sku LIKE ? OR p.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Category filter
    if (categoryId && !isNaN(categoryId)) {
      whereConditions.push('p.category_id = ?');
      params.push(categoryId);
    }

    // Stock Status filter
    if (stockStatus === 'low') {
      whereConditions.push('p.current_stock <= p.min_stock_threshold AND p.current_stock > 0');
    } else if (stockStatus === 'out') {
      whereConditions.push('p.current_stock = 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    try {
      // 1. Total Count Query
      const countSql = `SELECT COUNT(*) AS total FROM products p ${whereClause}`;
      const [countResult] = await query(countSql, params);
      const totalCount = countResult?.total || 0;
      const totalPages = Math.ceil(totalCount / limit) || 1;

      // 2. Data Fetch Query with JOIN to categories
      const dataSql = `
        SELECT 
          p.product_id,
          p.category_id,
          c.name AS category_name,
          p.sku,
          p.name,
          p.cost_price,
          p.selling_price,
          p.current_stock,
          p.min_stock_threshold,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY p.product_id DESC
        LIMIT ? OFFSET ?
      `;

      const products = await query(dataSql, [...params, limit, offset]);

      return res.status(200).json({
        success: true,
        products: products.map(p => ({
          ...p,
          cost_price: Number(p.cost_price),
          selling_price: Number(p.selling_price),
          current_stock: Number(p.current_stock),
          min_stock_threshold: Number(p.min_stock_threshold)
        })),
        totalCount,
        totalPages,
        currentPage: page
      });
    } catch (dbErr) {
      console.warn('[PRODUCTS]: Database offline, using filtered fallback catalog.');
      // Offline fallback filtering
      let filtered = fallbackProducts.filter(p => p.is_active === 1);

      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(p => p.sku.toLowerCase().includes(lower) || p.name.toLowerCase().includes(lower));
      }
      if (categoryId && !isNaN(categoryId)) {
        filtered = filtered.filter(p => p.category_id === categoryId);
      }
      if (stockStatus === 'low') {
        filtered = filtered.filter(p => p.current_stock <= p.min_stock_threshold && p.current_stock > 0);
      } else if (stockStatus === 'out') {
        filtered = filtered.filter(p => p.current_stock === 0);
      }

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const paginated = filtered.slice(offset, offset + limit);

      return res.status(200).json({
        success: true,
        products: paginated,
        totalCount,
        totalPages,
        currentPage: page
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/products
 * Admin only: Create a new product.
 * Automatically inserts an initial entry into 'stock_transactions' if starting stock > 0.
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      category_id,
      cost_price,
      selling_price,
      current_stock,
      min_stock_threshold
    } = req.body;

    // 1. Validation
    if (!sku || !sku.trim()) {
      return res.status(400).json({ success: false, message: 'SKU is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'Category selection is required.' });
    }

    const numCost = parseFloat(cost_price);
    const numSelling = parseFloat(selling_price);
    const numStock = parseInt(current_stock, 10) || 0;
    const numThreshold = parseInt(min_stock_threshold, 10) || 5;

    if (isNaN(numCost) || numCost < 0) {
      return res.status(400).json({ success: false, message: 'Cost price must be a non-negative number.' });
    }
    if (isNaN(numSelling) || numSelling < 0) {
      return res.status(400).json({ success: false, message: 'Selling price must be a non-negative number.' });
    }
    if (numStock < 0) {
      return res.status(400).json({ success: false, message: 'Initial stock cannot be negative.' });
    }

    const trimmedSku = sku.trim().toUpperCase();
    const trimmedName = name.trim();

    try {
      // 2. Perform Transactional Insertion
      const createdProduct = await withTransaction(async (connection) => {
        // Check for duplicate SKU
        const [existing] = await connection.execute('SELECT product_id FROM products WHERE sku = ?', [trimmedSku]);
        if (existing.length > 0) {
          const err = new Error(`Product with SKU '${trimmedSku}' already exists.`);
          err.statusCode = 409;
          throw err;
        }

        // Insert into products table
        const insertProductSql = `
          INSERT INTO products (
            sku, name, category_id, cost_price, selling_price, current_stock, min_stock_threshold, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;
        const [result] = await connection.execute(insertProductSql, [
          trimmedSku, trimmedName, category_id, numCost, numSelling, numStock, numThreshold
        ]);
        const newProductId = result.insertId;

        // 3. Automatically record in stock_transactions if starting stock > 0
        if (numStock > 0) {
          const insertTxSql = `
            INSERT INTO stock_transactions (
              product_id, transaction_type, quantity_changed, balance_after, reference_id
            ) VALUES (?, 'PURCHASE_IN', ?, ?, 'INITIAL-STOCK')
          `;
          await connection.execute(insertTxSql, [newProductId, numStock, numStock]);
        }

        return {
          product_id: newProductId,
          sku: trimmedSku,
          name: trimmedName,
          category_id,
          cost_price: numCost,
          selling_price: numSelling,
          current_stock: numStock,
          min_stock_threshold: numThreshold,
          is_active: 1
        };
      });

      return res.status(201).json({
        success: true,
        message: `Product '${trimmedName}' created successfully.`,
        product: createdProduct
      });
    } catch (dbErr) {
      if (dbErr.statusCode === 409) {
        return res.status(409).json({ success: false, message: dbErr.message });
      }
      console.warn('[PRODUCTS]: Database offline, saving in fallback state.');
      const newProd = {
        product_id: fallbackProducts.length + 1,
        sku: trimmedSku,
        name: trimmedName,
        category_id: parseInt(category_id, 10),
        cost_price: numCost,
        selling_price: numSelling,
        current_stock: numStock,
        min_stock_threshold: numThreshold,
        is_active: 1,
        created_at: new Date().toISOString()
      };
      fallbackProducts.unshift(newProd);

      return res.status(201).json({
        success: true,
        message: `Product '${trimmedName}' created successfully (offline demo).`,
        product: newProd
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/products/:id
 * Admin only: Update product metadata, pricing, and thresholds.
 */
export const updateProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const {
      name,
      category_id,
      cost_price,
      selling_price,
      min_stock_threshold
    } = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID parameter.' });
    }

    const numCost = parseFloat(cost_price);
    const numSelling = parseFloat(selling_price);
    const numThreshold = parseInt(min_stock_threshold, 10);

    if (isNaN(numCost) || numCost < 0 || isNaN(numSelling) || numSelling < 0) {
      return res.status(400).json({ success: false, message: 'Cost and Selling prices must be valid non-negative numbers.' });
    }

    try {
      const updateSql = `
        UPDATE products 
        SET 
          name = ?,
          category_id = ?,
          cost_price = ?,
          selling_price = ?,
          min_stock_threshold = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `;

      const result = await query(updateSql, [
        name.trim(), category_id, numCost, numSelling, numThreshold, productId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully.'
      });
    } catch (dbErr) {
      console.warn('[PRODUCTS]: Database offline, updating fallback state.');
      const idx = fallbackProducts.findIndex(p => p.product_id === productId);
      if (idx !== -1) {
        fallbackProducts[idx] = {
          ...fallbackProducts[idx],
          name: name.trim(),
          category_id: parseInt(category_id, 10),
          cost_price: numCost,
          selling_price: numSelling,
          min_stock_threshold: numThreshold
        };
      }
      return res.status(200).json({
        success: true,
        message: 'Product updated successfully (offline demo).'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/products/:id
 * Admin only: Soft delete product by setting is_active = FALSE.
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    try {
      const sql = 'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?';
      const result = await query(sql, [productId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Product successfully archived (soft deleted).'
      });
    } catch (dbErr) {
      console.warn('[PRODUCTS]: Database offline, soft deleting in fallback state.');
      fallbackProducts = fallbackProducts.filter(p => p.product_id !== productId);
      return res.status(200).json({
        success: true,
        message: 'Product successfully archived (offline demo).'
      });
    }
  } catch (error) {
    next(error);
  }
};
