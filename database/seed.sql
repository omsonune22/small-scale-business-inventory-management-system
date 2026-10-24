-- Seed Data for Small-Scale Business Inventory & POS System
USE inventory_pos_db;

-- 1. Default Users (Passwords hashed with bcrypt: 'admin123' and 'staff123')
-- $2b$10$wTkyzQZ9sVd8w7R2L60vDeS0Zp8v25B.Xw7bVbT/tS1z0r1eB/oae -> admin123
-- $2b$10$7vN31aWsmjNlVwHwEek6j.hR85V1v23I4K8FmJd20O8/4YpA06u86 -> staff123
INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
('admin', 'admin@retailpos.com', '$2b$10$wTkyzQZ9sVd8w7R2L60vDeS0Zp8v25B.Xw7bVbT/tS1z0r1eB/oae', 'System Administrator', 'ADMIN', 1),
('john_staff', 'staff@retailpos.com', '$2b$10$7vN31aWsmjNlVwHwEek6j.hR85V1v23I4K8FmJd20O8/4YpA06u86', 'John Cashier', 'STAFF', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. Categories
INSERT INTO categories (category_id, name, description) VALUES
(1, 'Beverages & Soft Drinks', 'Packaged juices, sodas, sparkling water, and cold drinks'),
(2, 'Packaged Snacks', 'Chips, biscuits, wafers, nuts, and instant snacks'),
(3, 'Dairy & Essentials', 'Milk, butter, cheese, and morning essentials'),
(4, 'Personal Care', 'Soaps, shampoos, oral hygiene, and sanitizers')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Suppliers
INSERT INTO suppliers (supplier_id, company_name, contact_person, phone, email, address) VALUES
(1, 'Apex FMCG Distributors', 'Robert Vance', '+1 (555) 234-5678', 'orders@apexfmcg.com', '104 Industrial Parkway, Sector 4'),
(2, 'Sunrise Dairy Co.', 'Elena Rostova', '+1 (555) 876-5432', 'supply@sunrisedairy.com', '42 Green Valley Rd, Farm Zone'),
(3, 'Global Refreshments Ltd.', 'Marcus Sterling', '+1 (555) 345-6789', 'contact@globalrefresh.com', '88 Harbor Boulevard, Port District')
ON DUPLICATE KEY UPDATE company_name=VALUES(company_name);

-- 4. Products
INSERT INTO products (product_id, category_id, sku, name, cost_price, selling_price, current_stock, min_stock_threshold, is_active) VALUES
(1, 1, 'BEV-COL-330', 'Sparkling Cola 330ml Can', 0.65, 1.50, 48, 12, 1),
(2, 1, 'BEV-ORG-500', 'Pure Orange Nectar 500ml', 1.20, 2.50, 22, 10, 1),
(3, 2, 'SNK-CHIP-SALT', 'Artisan Sea Salt Potato Chips 150g', 0.95, 2.20, 35, 8, 1),
(4, 2, 'SNK-OAT-CHOC', 'Oat & Dark Chocolate Cookies 200g', 1.40, 3.00, 15, 6, 1),
(5, 3, 'DRY-MILK-1L', 'Full Cream Pasteurized Milk 1L', 0.80, 1.40, 18, 10, 1),
(6, 3, 'DRY-CHDR-250', 'Aged Cheddar Block 250g', 2.10, 4.25, 9, 5, 1),
(7, 4, 'PC-SOAP-ALOE', 'Organic Aloe Vera Hand Soap 250ml', 1.10, 2.75, 4, 8, 1), -- Low stock alert demonstration!
(8, 4, 'PC-TP-MINT', 'Botanical Mint Toothpaste 100ml', 1.30, 2.99, 2, 5, 1)   -- Low stock alert demonstration!
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Initial Stock Audit Ledger Entries
INSERT INTO stock_transactions (product_id, transaction_type, quantity_changed, balance_after, reference_id) VALUES
(1, 'PURCHASE_IN', 48, 48, 'INIT-STOCK-2026'),
(2, 'PURCHASE_IN', 22, 22, 'INIT-STOCK-2026'),
(3, 'PURCHASE_IN', 35, 35, 'INIT-STOCK-2026'),
(4, 'PURCHASE_IN', 15, 15, 'INIT-STOCK-2026'),
(5, 'PURCHASE_IN', 18, 18, 'INIT-STOCK-2026'),
(6, 'PURCHASE_IN', 9, 9, 'INIT-STOCK-2026'),
(7, 'PURCHASE_IN', 4, 4, 'INIT-STOCK-2026'),
(8, 'PURCHASE_IN', 2, 2, 'INIT-STOCK-2026');
