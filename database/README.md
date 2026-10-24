# Small-Scale Business Inventory Management & POS System

## System Architecture & Database Blueprint

### 1. Database Configuration
- **Engine**: MySQL 8.0 (InnoDB)
- **Database Name**: `inventory_pos_db`
- **Schema Script**: [`database/schema.sql`](file:///d:/sql%20project/database/schema.sql)
- **Seed Data Script**: [`database/seed.sql`](file:///d:/sql%20project/database/seed.sql)

### 2. Relational Schema & Tables
- `users`: Authentication & RBAC (`ADMIN`, `STAFF`)
- `categories`: Product categorization
- `products`: SKU tracking, pricing, current stock, minimum stock thresholds
- `suppliers`: Supplier directory & contact details
- `purchases`: Supplier purchase orders & intake
- `purchase_items`: Line items with unit cost and subtotal
- `sales`: POS transactions, invoice numbering, discounts, tax, and payment methods
- `sale_items`: Sale order line items linked to products
- `stock_transactions`: Immutable double-entry audit ledger for stock tracking (`PURCHASE_IN`, `SALE_OUT`, `MANUAL_ADJUSTMENT`)

### 3. ACID Guarantees & Concurrency Control
- **Row Locking**: Point-of-Sale checkouts lock product rows using `SELECT current_stock FROM products WHERE product_id = ? FOR UPDATE` inside an active MySQL transaction.
- **Stock Audit Ledger**: Every quantity alteration immediately inserts a permanent audit row with `balance_after` in `stock_transactions`.
- **Atomic Operations**: If any item in a sale has insufficient stock, the entire transaction rolls back cleanly without discrepancies.
