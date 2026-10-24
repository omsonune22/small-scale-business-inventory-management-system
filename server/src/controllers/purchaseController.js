import { query, withTransaction } from '../config/db.js';

// Fallback in-memory purchase history for offline demo
let fallbackPurchases = [
  {
    purchase_id: 1,
    supplier_id: 1,
    supplier_name: 'Apex FMCG Distributors',
    user_id: 1,
    user_name: 'Admin Manager',
    invoice_reference: 'INV-APEX-7842',
    total_amount: 850.00,
    payment_status: 'PAID',
    purchase_date: '2026-10-21 14:30:00',
    created_at: '2026-10-21 14:30:00',
    items: [
      { purchase_item_id: 1, product_id: 1, sku: 'BEV-COLA-500', product_name: 'Sparkling Classic Cola 500ml', quantity: 60, unit_cost: 0.75, subtotal: 45.00 },
      { purchase_item_id: 2, product_id: 3, sku: 'SNK-CHIP-BBQ', product_name: 'Smoked BBQ Kettle Potato Chips 150g', quantity: 45, unit_cost: 1.10, subtotal: 49.50 }
    ]
  },
  {
    purchase_id: 2,
    supplier_id: 2,
    supplier_name: 'Sunrise Dairy Co.',
    user_id: 1,
    user_name: 'Admin Manager',
    invoice_reference: 'INV-SUN-9021',
    total_amount: 420.50,
    payment_status: 'PAID',
    purchase_date: '2026-10-22 10:15:00',
    created_at: '2026-10-22 10:15:00',
    items: [
      { purchase_item_id: 3, product_id: 2, sku: 'BEV-OJ-1L', product_name: '100% Pure Orange Juice 1L', quantity: 30, unit_cost: 1.80, subtotal: 54.00 }
    ]
  }
];

/**
 * POST /api/v1/purchases
 * Purchase Inward Endpoint enforcing ACID guarantees:
 * - Begins transaction
 * - Inserts purchase record
 * - Inserts purchase line items
 * - Updates product current_stock and cost_price with row-level locking (FOR UPDATE)
 * - Inserts immutable audit records into stock_transactions
 * - Commits or rolls back automatically on failure
 */
export const createPurchase = async (req, res, next) => {
  try {
    const { supplier_id, invoice_reference, payment_status, notes, items } = req.body;
    const userId = req.user?.userId || 1;

    // 1. Validation
    if (!supplier_id) {
      return res.status(400).json({ success: false, message: 'Supplier is required.' });
    }
    if (!invoice_reference || !invoice_reference.trim()) {
      return res.status(400).json({ success: false, message: 'Invoice reference is required.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one purchase item is required.' });
    }

    // Validate and sanitize each line item
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prodId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);
      const cost = parseFloat(item.unit_cost);

      if (isNaN(prodId) || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
        return res.status(400).json({
          success: false,
          message: 'All items must have valid product, quantity (> 0), and unit cost (>= 0).'
        });
      }

      const subtotal = Number((qty * cost).toFixed(2));
      calculatedTotal += subtotal;
      validatedItems.push({
        product_id: prodId,
        quantity: qty,
        unit_cost: cost,
        subtotal
      });
    }

    const trimmedInvoice = invoice_reference.trim();
    const status = payment_status || 'PAID';

    try {
      // 2. ACID Transaction Execution
      const purchaseResult = await withTransaction(async (connection) => {
        // a. INSERT into purchases
        const insertPurchaseSql = `
          INSERT INTO purchases (
            supplier_id, user_id, invoice_reference, total_amount, payment_status, purchase_date
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const [pResult] = await connection.execute(insertPurchaseSql, [
          supplier_id, userId, trimmedInvoice, calculatedTotal, status
        ]);
        const purchaseId = pResult.insertId;

        // b. Loop through validated items
        for (const line of validatedItems) {
          // i. INSERT into purchase_items
          const insertLineSql = `
            INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `;
          await connection.execute(insertLineSql, [
            purchaseId, line.product_id, line.quantity, line.unit_cost, line.subtotal
          ]);

          // ii. Row Lock Product for ACID stock update
          const [prodRows] = await connection.execute(
            'SELECT current_stock, name FROM products WHERE product_id = ? FOR UPDATE',
            [line.product_id]
          );

          if (prodRows.length === 0) {
            throw new Error(`Product ID ${line.product_id} not found in catalog.`);
          }

          const currentStock = prodRows[0].current_stock;
          const balanceAfter = currentStock + line.quantity;

          // iii. UPDATE products current_stock and cost_price
          await connection.execute(
            `UPDATE products 
             SET current_stock = ?, cost_price = ?, updated_at = NOW() 
             WHERE product_id = ?`,
            [balanceAfter, line.unit_cost, line.product_id]
          );

          // iv. INSERT into stock_transactions (Audit Ledger)
          const insertAuditSql = `
            INSERT INTO stock_transactions (
              product_id, transaction_type, quantity_changed, balance_after, reference_id, created_at
            ) VALUES (?, 'PURCHASE_IN', ?, ?, ?, NOW())
          `;
          await connection.execute(insertAuditSql, [
            line.product_id, line.quantity, balanceAfter, trimmedInvoice
          ]);
        }

        return {
          purchase_id: purchaseId,
          invoice_reference: trimmedInvoice,
          total_amount: calculatedTotal,
          item_count: validatedItems.length
        };
      });

      return res.status(201).json({
        success: true,
        message: `Purchase '${trimmedInvoice}' received. Stock and audit ledger updated successfully.`,
        purchase: purchaseResult
      });
    } catch (dbErr) {
      console.warn('[PURCHASES]: Database offline, saving in fallback state.');
      const newPurchase = {
        purchase_id: fallbackPurchases.length + 1,
        supplier_id: parseInt(supplier_id, 10),
        supplier_name: 'Apex FMCG Distributors',
        user_id: userId,
        user_name: req.user?.fullName || 'Admin Manager',
        invoice_reference: trimmedInvoice,
        total_amount: calculatedTotal,
        payment_status: status,
        purchase_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        items: validatedItems.map((it, idx) => ({
          purchase_item_id: idx + 10,
          product_id: it.product_id,
          sku: 'PROD-SKU-' + it.product_id,
          product_name: 'Catalog Item #' + it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
          subtotal: it.subtotal
        }))
      };
      fallbackPurchases.unshift(newPurchase);

      return res.status(201).json({
        success: true,
        message: `Purchase '${trimmedInvoice}' received (offline demo mode).`,
        purchase: newPurchase
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/purchases
 * Paginated list of past purchase orders with supplier join.
 */
export const getPurchases = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const supplierId = req.query.supplier_id ? parseInt(req.query.supplier_id, 10) : null;

    const whereConditions = ['1=1'];
    const params = [];

    if (search) {
      whereConditions.push('(p.invoice_reference LIKE ? OR s.company_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (supplierId && !isNaN(supplierId)) {
      whereConditions.push('p.supplier_id = ?');
      params.push(supplierId);
    }

    const whereClause = whereConditions.join(' AND ');

    try {
      const countSql = `
        SELECT COUNT(*) AS total 
        FROM purchases p 
        LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id 
        WHERE ${whereClause}
      `;
      const [countResult] = await query(countSql, params);
      const totalCount = countResult?.total || 0;
      const totalPages = Math.ceil(totalCount / limit) || 1;

      const dataSql = `
        SELECT 
          p.purchase_id,
          p.supplier_id,
          s.company_name AS supplier_name,
          p.user_id,
          u.full_name AS created_by_name,
          p.invoice_reference,
          p.total_amount,
          p.payment_status,
          p.purchase_date,
          p.created_at,
          COUNT(pi.purchase_item_id) AS total_items
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
        LEFT JOIN users u ON p.user_id = u.user_id
        LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
        WHERE ${whereClause}
        GROUP BY p.purchase_id, p.supplier_id, s.company_name, p.user_id, u.full_name, p.invoice_reference, p.total_amount, p.payment_status, p.purchase_date, p.created_at
        ORDER BY p.purchase_id DESC
        LIMIT ? OFFSET ?
      `;

      const purchases = await query(dataSql, [...params, limit, offset]);

      return res.status(200).json({
        success: true,
        purchases: purchases.map(p => ({
          ...p,
          total_amount: Number(p.total_amount),
          total_items: Number(p.total_items) || 0
        })),
        totalCount,
        totalPages,
        currentPage: page
      });
    } catch (dbErr) {
      console.warn('[PURCHASES]: Database offline, using fallback purchases list.');
      let filtered = [...fallbackPurchases];
      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.invoice_reference.toLowerCase().includes(lower) || 
          p.supplier_name.toLowerCase().includes(lower)
        );
      }
      if (supplierId && !isNaN(supplierId)) {
        filtered = filtered.filter(p => p.supplier_id === supplierId);
      }

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const paginated = filtered.slice(offset, offset + limit);

      return res.status(200).json({
        success: true,
        purchases: paginated,
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
 * GET /api/v1/purchases/:id
 * Detail view of a purchase order with all received line items.
 */
export const getPurchaseById = async (req, res, next) => {
  try {
    const purchaseId = parseInt(req.params.id, 10);
    if (isNaN(purchaseId)) {
      return res.status(400).json({ success: false, message: 'Invalid purchase ID.' });
    }

    try {
      const pSql = `
        SELECT 
          p.purchase_id,
          p.supplier_id,
          s.company_name AS supplier_name,
          s.phone AS supplier_phone,
          s.email AS supplier_email,
          p.user_id,
          u.full_name AS received_by,
          p.invoice_reference,
          p.total_amount,
          p.payment_status,
          p.purchase_date,
          p.created_at
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
        LEFT JOIN users u ON p.user_id = u.user_id
        WHERE p.purchase_id = ?
      `;
      const [pRows] = await query(pSql, [purchaseId]);
      if (pRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Purchase order not found.' });
      }

      const purchase = pRows[0];

      // Fetch Items
      const itemsSql = `
        SELECT 
          pi.purchase_item_id,
          pi.product_id,
          pr.sku,
          pr.name AS product_name,
          pi.quantity,
          pi.unit_cost,
          pi.subtotal
        FROM purchase_items pi
        LEFT JOIN products pr ON pi.product_id = pr.product_id
        WHERE pi.purchase_id = ?
        ORDER BY pi.purchase_item_id ASC
      `;
      const items = await query(itemsSql, [purchaseId]);

      return res.status(200).json({
        success: true,
        purchase: {
          ...purchase,
          total_amount: Number(purchase.total_amount),
          items: items.map(it => ({
            ...it,
            quantity: Number(it.quantity),
            unit_cost: Number(it.unit_cost),
            subtotal: Number(it.subtotal)
          }))
        }
      });
    } catch (dbErr) {
      console.warn('[PURCHASES]: Database offline, checking fallback items.');
      const found = fallbackPurchases.find(p => p.purchase_id === purchaseId);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Purchase order not found.' });
      }
      return res.status(200).json({ success: true, purchase: found });
    }
  } catch (error) {
    next(error);
  }
};
