import { query, withTransaction } from '../config/db.js';

// In-memory fallback sales history for offline development
let fallbackSales = [
  {
    sale_id: 1,
    invoice_number: 'INV-20261023-1001',
    user_id: 1,
    cashier_name: 'Admin Manager',
    customer_name: 'Walk-in Customer',
    subtotal: 5.40,
    discount_amount: 0.00,
    tax_amount: 0.27,
    final_total: 5.67,
    payment_method: 'CASH',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    items: [
      { sale_item_id: 1, product_id: 1, sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', quantity: 2, unit_price: 1.50, subtotal: 3.00 },
      { sale_item_id: 2, product_id: 3, sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', quantity: 1, unit_price: 2.40, subtotal: 2.40 }
    ]
  }
];

// Offline stock tracking helper for demo
let localStockCache = {
  1: 60,
  2: 30,
  3: 45,
  4: 25,
  5: 40
};

/**
 * POST /api/v1/sales
 * Strict ACID Sales Engine with Row-Level Locking (FOR UPDATE)
 * Payload: { customer_name, payment_method, discount_amount, items: [ { product_id, quantity, unit_price } ] }
 */
export const createSale = async (req, res, next) => {
  try {
    const { customer_name, payment_method, discount_amount, items } = req.body;
    const userId = req.user?.userId || 1;
    const cashierName = req.user?.fullName || 'Cashier';

    // Step a. Verify items array is not empty
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty. At least one line item is required.'
      });
    }

    // Step b. Generate unique invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    const customerName = (customer_name && customer_name.trim()) ? customer_name.trim() : 'Walk-in Customer';
    const paymentMethod = ['CASH', 'CARD', 'UPI', 'CREDIT'].includes(payment_method) ? payment_method : 'CASH';
    const discount = Math.max(0, parseFloat(discount_amount) || 0);

    try {
      // Execute strict ACID transaction
      const saleResult = await withTransaction(async (connection) => {
        let subtotal = 0;
        const processedLines = [];

        // Step c. For each item: Query with FOR UPDATE and verify stock sufficiency
        for (const it of items) {
          const prodId = parseInt(it.product_id, 10);
          const requestedQty = parseInt(it.quantity, 10);
          const unitPrice = parseFloat(it.unit_price);

          if (isNaN(prodId) || isNaN(requestedQty) || requestedQty <= 0) {
            throw new Error('Invalid item parameters: Quantity must be at least 1.');
          }

          // Row lock product record: SELECT ... FOR UPDATE
          const [rows] = await connection.execute(
            'SELECT product_id, sku, name, current_stock, selling_price FROM products WHERE product_id = ? FOR UPDATE',
            [prodId]
          );

          if (rows.length === 0) {
            throw new Error(`Product with ID ${prodId} does not exist in inventory.`);
          }

          const product = rows[0];
          const availableStock = product.current_stock;

          // Check for insufficient stock
          if (availableStock < requestedQty) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${availableStock}`);
          }

          const price = !isNaN(unitPrice) && unitPrice >= 0 ? unitPrice : parseFloat(product.selling_price);
          const lineSubtotal = Number((requestedQty * price).toFixed(2));
          subtotal += lineSubtotal;

          processedLines.push({
            product_id: prodId,
            sku: product.sku,
            name: product.name,
            quantity: requestedQty,
            unit_price: price,
            subtotal: lineSubtotal,
            availableStock
          });
        }

        // Step d. Calculate subtotal, tax (5%), subtract discount, calculate final_total
        const taxRate = 0.05; // 5% GST/VAT
        const taxAmount = Number((subtotal * taxRate).toFixed(2));
        const finalTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

        // Step e. INSERT into 'sales'
        const insertSaleSql = `
          INSERT INTO sales (
            invoice_number, user_id, customer_name, subtotal, discount_amount, tax_amount, final_total, payment_method, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const [sResult] = await connection.execute(insertSaleSql, [
          invoiceNumber, userId, customerName, subtotal, discount, taxAmount, finalTotal, paymentMethod
        ]);
        const saleId = sResult.insertId;

        // Step f. For each item: Insert sale_items, deduct current_stock, and record in stock_transactions
        for (const line of processedLines) {
          // 1. INSERT into sale_items
          const insertItemSql = `
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `;
          await connection.execute(insertItemSql, [
            saleId, line.product_id, line.quantity, line.unit_price, line.subtotal
          ]);

          // 2. UPDATE products current_stock
          const balanceAfter = line.availableStock - line.quantity;
          await connection.execute(
            'UPDATE products SET current_stock = ?, updated_at = NOW() WHERE product_id = ?',
            [balanceAfter, line.product_id]
          );

          // 3. INSERT into stock_transactions (Audit Ledger)
          const insertAuditSql = `
            INSERT INTO stock_transactions (
              product_id, transaction_type, quantity_changed, balance_after, reference_id, created_at
            ) VALUES (?, 'SALE_OUT', ?, ?, ?, NOW())
          `;
          await connection.execute(insertAuditSql, [
            line.product_id, -line.quantity, balanceAfter, invoiceNumber
          ]);
        }

        return {
          sale_id: saleId,
          invoice_number: invoiceNumber,
          customer_name: customerName,
          cashier_name: cashierName,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discount,
          final_total: finalTotal,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
          items: processedLines
        };
      });

      return res.status(201).json({
        success: true,
        message: `Sale ${invoiceNumber} completed successfully. Stock updated and audit ledger entry recorded.`,
        sale: saleResult
      });
    } catch (transactionError) {
      // Step g. On error: Rollback is handled by withTransaction; return 400 with exact message
      console.warn('[SALES ACID ROLLBACK]: Transaction rolled back.', transactionError.message);

      // Handle offline demo fallback when database is not connected
      if (transactionError.code === 'ECONNREFUSED' || transactionError.fatal) {
        return handleOfflineSaleFallback(req, res, {
          invoiceNumber,
          customerName,
          cashierName,
          paymentMethod,
          discount,
          items
        });
      }

      return res.status(400).json({
        success: false,
        message: transactionError.message || 'Transaction could not be completed.'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/sales/:id
 * Returns complete sale invoice details including join on sale_items and products.
 */
export const getSaleById = async (req, res, next) => {
  try {
    const saleId = parseInt(req.params.id, 10);
    if (isNaN(saleId)) {
      return res.status(400).json({ success: false, message: 'Invalid sale ID.' });
    }

    try {
      const saleSql = `
        SELECT 
          s.sale_id,
          s.invoice_number,
          s.user_id,
          u.full_name AS cashier_name,
          s.customer_name,
          s.subtotal,
          s.discount_amount,
          s.tax_amount,
          s.final_total,
          s.payment_method,
          s.created_at
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE s.sale_id = ?
      `;
      const [saleRows] = await query(saleSql, [saleId]);
      if (saleRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Sale invoice not found.' });
      }

      const sale = saleRows[0];

      const itemsSql = `
        SELECT 
          si.sale_item_id,
          si.product_id,
          p.sku,
          p.name,
          si.quantity,
          si.unit_price,
          si.subtotal
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.product_id
        WHERE si.sale_id = ?
        ORDER BY si.sale_item_id ASC
      `;
      const items = await query(itemsSql, [saleId]);

      return res.status(200).json({
        success: true,
        sale: {
          ...sale,
          subtotal: Number(sale.subtotal),
          discount_amount: Number(sale.discount_amount),
          tax_amount: Number(sale.tax_amount),
          final_total: Number(sale.final_total),
          items: items.map(it => ({
            ...it,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
            subtotal: Number(it.subtotal)
          }))
        }
      });
    } catch (dbErr) {
      console.warn('[GET SALE DETAILS]: Database offline, checking fallback sales.');
      const found = fallbackSales.find(s => s.sale_id === saleId);
      if (!found) {
        return res.status(404).json({ success: false, message: 'Sale invoice not found.' });
      }
      return res.status(200).json({ success: true, sale: found });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/sales
 * List recent sales orders
 */
export const getSales = async (req, res, next) => {
  try {
    try {
      const sql = `
        SELECT 
          s.sale_id,
          s.invoice_number,
          s.customer_name,
          s.subtotal,
          s.discount_amount,
          s.tax_amount,
          s.final_total,
          s.payment_method,
          s.created_at,
          COUNT(si.sale_item_id) AS total_items
        FROM sales s
        LEFT JOIN sale_items si ON s.sale_id = si.sale_id
        GROUP BY s.sale_id, s.invoice_number, s.customer_name, s.subtotal, s.discount_amount, s.tax_amount, s.final_total, s.payment_method, s.created_at
        ORDER BY s.sale_id DESC
        LIMIT 20
      `;
      const sales = await query(sql);
      return res.status(200).json({
        success: true,
        count: sales.length,
        sales: sales.map(s => ({
          ...s,
          subtotal: Number(s.subtotal),
          final_total: Number(s.final_total),
          total_items: Number(s.total_items) || 0
        }))
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        count: fallbackSales.length,
        sales: fallbackSales
      });
    }
  } catch (error) {
    next(error);
  }
};

// Offline Demo Fallback processor
function handleOfflineSaleFallback(req, res, { invoiceNumber, customerName, cashierName, paymentMethod, discount, items }) {
  let subtotal = 0;
  const processedLines = [];

  for (const it of items) {
    const prodId = parseInt(it.product_id, 10);
    const qty = parseInt(it.quantity, 10);
    const unitPrice = parseFloat(it.unit_price) || 2.00;
    const currentStock = localStockCache[prodId] !== undefined ? localStockCache[prodId] : 50;

    if (currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for Catalog Item #${prodId}. Available: ${currentStock}`
      });
    }

    localStockCache[prodId] = currentStock - qty;
    const lineSubtotal = Number((qty * unitPrice).toFixed(2));
    subtotal += lineSubtotal;

    processedLines.push({
      product_id: prodId,
      sku: 'SKU-PROD-' + prodId,
      name: it.name || ('Catalog Item #' + prodId),
      quantity: qty,
      unit_price: unitPrice,
      subtotal: lineSubtotal
    });
  }

  const taxAmount = Number((subtotal * 0.05).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  const newSale = {
    sale_id: fallbackSales.length + 101,
    invoice_number: invoiceNumber,
    customer_name: customerName,
    cashier_name: cashierName,
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discount,
    final_total: finalTotal,
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
    items: processedLines
  };

  fallbackSales.unshift(newSale);

  return res.status(201).json({
    success: true,
    message: `Sale ${invoiceNumber} completed successfully (offline demo mode).`,
    sale: newSale
  });
}
