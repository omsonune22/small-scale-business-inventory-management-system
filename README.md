# RetailPulse: Small-Scale Business Inventory Management & POS System

A transactional, web-based Inventory Management and Point of Sale (POS) system engineered for small-scale retail and grocery enterprises. The system enforces **strict ACID guarantees**, **pessimistic row-level locking (`FOR UPDATE`)**, **Role-Based Access Control (RBAC)**, an **immutable double-entry audit ledger**, and a **business intelligence reporting engine** with CSV export streaming.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                           React 18 + Vite Frontend Client                         |
|  - Modern Dark Aesthetic & Responsive Design (Mobile / Tablet Hamburger Drawer)   |
|  - Real-time Point of Sale (POS) Register with Keyboard Shortcuts ([F9], Barcode) |
|  - Recharts Visualizations & Dynamic Metric Cards                                 |
|  - Global Toast Notification System & Confirmation Modals                         |
|  - Axios HTTP Client with Bearer JWT Interceptors                                 |
+------------------------------------------+----------------------------------------+
                                           |
                                  REST API (JSON over HTTP)
                                  Bearer JWT Authorization
                                           |
+------------------------------------------v----------------------------------------+
|                              Node.js + Express.js API                             |
|  - ES Modules ("type": "module")                                                 |
|  - JWT Authentication Middleware & RBAC Guards (Admin vs. Staff)                  |
|  - Defensive Input Sanitization (XSS Stripper) & Non-Negative Number Validation   |
|  - Atomic Database Transaction Wrapper (`withTransaction`)                        |
|  - CSV Stream Generator with Content-Disposition Headers                          |
+------------------------------------------+----------------------------------------+
                                           |
                                Connection Pool (10 max)
                                           |
+------------------------------------------v----------------------------------------+
|                             MySQL 8.0 Database (InnoDB)                           |
|  - Primary & Foreign Keys with ON DELETE RESTRICT on Master Products              |
|  - CHECK Constraints (cost_price >= 0, selling_price >= 0, current_stock >= 0)    |
|  - Pessimistic Concurrency Control (SELECT ... FOR UPDATE)                        |
|  - Immutable Double-Entry Audit Ledger (`stock_transactions`)                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Default Test Login Credentials

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@store.com` | `Admin@123` | Full access: Dashboard metrics with inventory valuation, POS, Products, Purchases, Suppliers, Audit Ledger, BI Reports, CSV Exports, User Management. |
| **Cashier / Staff** | `staff@store.com` | `Staff@123` | Point of Sale (POS) checkout, product catalog search, and basic dashboard metrics. Financial cost margins and administrative modules are restricted (HTTP 403). |

> **Pro-Tip**: Use the **"Quick Demo Fill"** buttons on the `/login` screen or the **"Simulate Role"** toggle in the top navigation bar to test role permissions instantly.

---

## 3. ACID Transaction Implementation in POS Checkout

Point of Sale operations modify financial records and physical stock levels simultaneously. To eliminate race conditions, stock discrepancies, and partial writes, the POS engine executes inside a single **MySQL InnoDB ACID Transaction**:

```
        CLIENT (POST /api/v1/sales)
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 1. START TRANSACTION (connection.beginTransaction())   │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 2. PESSIMISTIC ROW-LEVEL LOCKING                       │
│    SELECT product_id, name, current_stock              │
│    FROM products WHERE product_id = ? FOR UPDATE;      │
│    (Blocks concurrent checkouts from reading stale     │
│     stock until this transaction finishes)             │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 3. DEFENSIVE STOCK SUFFICIENCY CHECK                   │
│    IF current_stock < requested_quantity:              │
│      -> THROW Error("Insufficient stock for [item]")   │
│      -> ROLLBACK TRANSACTION                           │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 4. FINANCIAL TOTAL CALCULATION                         │
│    subtotal = SUM(quantity * unit_price)               │
│    tax_amount = subtotal * 0.05 (GST)                  │
│    final_total = subtotal + tax - discount             │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 5. ATOMIC DATA WRITES                                  │
│    a. INSERT INTO sales                                │
│    b. INSERT INTO sale_items (line items)              │
│    c. UPDATE products SET current_stock = stock - qty  │
│    d. INSERT INTO stock_transactions                   │
│       ('SALE_OUT', -qty, balance_after, invoice_no)    │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ 6. COMMIT TRANSACTION (connection.commit())            │
│    (Row locks released; client receives Invoice &      │
│     receipt data for 80mm thermal printing)            │
└────────────────────────────────────────────────────────┘
```

### The 4 ACID Properties in Practice:
1. **Atomicity**: If one product in a 10-item cart fails the stock check or has negative parameters, all queries roll back. No partial order is stored, and no stock is deducted.
2. **Consistency**: MySQL `CHECK (current_stock >= 0)` constraints and Foreign Keys with `ON DELETE RESTRICT` guarantee that product stock cannot fall below zero and historical sales invoices cannot be orphaned.
3. **Isolation**: Row-level locking (`FOR UPDATE`) prevents two cashiers from selling the last available unit simultaneously (eliminating lost updates).
4. **Durability**: Upon `COMMIT`, all sales records and ledger entries are permanently written to the InnoDB redo log and disk.

---

## 4. Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MySQL Server**: v8.0 or higher (InnoDB engine)

---

### Step 1: Clone & Configure Environment Variables

#### Backend `.env` (`/server/.env`):
```env
PORT=5000
NODE_ENV=development

# MySQL 8.0 Connection
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_pos_db
DB_PORT=3306

# Authentication Secrets
JWT_SECRET=retailpulse_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=8h
```

#### Frontend `.env` (`/client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

### Step 2: Database Initialization & Seeding

The backend includes an automated seed script that creates the database, defines all 9 relational tables, and populates realistic demo items:

```bash
cd server
npm install
npm run seed
```

*(Alternatively, run [`schema.sql`](file:///d:/sql%20project/schema.sql) directly inside MySQL Workbench or CLI).*

---

### Step 3: Run the Development Servers

Open two terminal windows:

#### Terminal 1: Backend REST API
```bash
cd server
npm run dev
# Active on http://localhost:5000
```

#### Terminal 2: Vite React Frontend Client
```bash
cd client
npm install
npm run dev
# Active on http://localhost:3000
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. REST API Endpoint Reference

### Authentication & Users
- `POST /api/v1/auth/login`: Verify credentials, reject inactive users, issue 8-hour JWT.
- `GET /api/v1/auth/me`: Fetch authenticated user profile.
- `GET /api/v1/users`: [Admin] List all registered personnel.
- `POST /api/v1/users`: [Admin] Create new Staff cashier account.
- `PATCH /api/v1/users/:id/toggle-status`: [Admin] Deactivate or activate accounts.

### Executive Dashboard
- `GET /api/v1/dashboard/metrics`: Single-query scalar aggregation (`totalProducts`, `totalStockUnits`, `totalStockCostValue`, `totalSalesToday`, `lowStockCount`).
- `GET /api/v1/dashboard/low-stock`: Top 5 products requiring replenishment.
- `GET /api/v1/dashboard/recent-sales`: Last 5 checkout orders.

### Product Catalog & Categories
- `GET /api/v1/categories`: List categories with active product counts.
- `POST /api/v1/categories`: [Admin] Add new product category.
- `GET /api/v1/products`: Server-side pagination (`?page=1&limit=10&search=&category_id=&stock_status=`).
- `POST /api/v1/products`: [Admin] Add product with initial stock audit entry.
- `PUT /api/v1/products/:id`: [Admin] Update metadata, pricing, and thresholds.
- `DELETE /api/v1/products/:id`: [Admin] Soft-delete preserving historical sales invariants.

### Suppliers & Restock Inward
- `GET /api/v1/suppliers`: Active vendor directory.
- `POST /api/v1/suppliers`: [Admin] Register supplier.
- `POST /api/v1/purchases`: [Admin] ACID restock intake with stock increments and audit records.
- `GET /api/v1/purchases`: Paginated purchase history.
- `GET /api/v1/purchases/:id`: Purchase line item inspection.

### Point of Sale (POS) Engine
- `POST /api/v1/sales`: Strict ACID POS checkout with row-level locks (`FOR UPDATE`).
- `GET /api/v1/sales/:id`: Retrieve receipt details for reprint.

### Inventory Audit Ledger & Stock Adjustments
- `GET /api/v1/inventory/ledger`: Paginated immutable audit trail (`?product_id=&type=&from_date=&to_date=`).
- `POST /api/v1/inventory/adjust`: [Admin] Manual stock adjustment (`DAMAGED`, `LOST`, `CORRECTION`) with non-negative stock validation.
- `GET /api/v1/inventory/low-stock-report`: Threshold report with `units_needed = (min_threshold * 2) - current_stock`.

### Business Intelligence & Reports
- `GET /api/v1/reports/sales-summary`: Daily/weekly/monthly sales, gross volume, discounts, taxes, net revenue.
- `GET /api/v1/reports/top-products`: Ranked sales velocity and gross profit calculations.
- `GET /api/v1/reports/inventory-valuation`: Total asset cost basis, retail potential, and department margin health.
- `GET /api/v1/reports/export-csv`: Stream CSV files (`?type=sales | inventory | low_stock`).

---

## 6. Defensive Security & Production Features

1. **Defensive Input Sanitization**: Express middleware recursively filters all incoming string fields against `<script>`, HTML tags, and event handlers.
2. **Defensive Non-Negative Numbers**: Client forms and API controllers validate `quantity > 0`, `cost_price >= 0`, `selling_price >= 0`, and clamp discounts to avoid negative receipts.
3. **HTTP 403 & 404 Handlers**: Dedicated error pages with role-aware redirection to protect confidential business intelligence data.
4. **Thermal Receipt Printing**: 80mm standard receipt modal formatted for POS thermal printers via `@media print`.
5. **Offline Fallback Architecture**: All controllers include memory state fallbacks ensuring zero frontend crashes even during database downtime or academic demos.
