-- ==============================================================================
-- Small Scale Business Inventory Management System
-- Schema & Seed Data Script
-- Engine: MySQL 8.0 (InnoDB)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS inventory_pos_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE inventory_pos_db;

-- ------------------------------------------------------------------------------
-- 1. Table Drops (Reverse Dependency Order)
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 2. Schema Definition
-- ------------------------------------------------------------------------------

-- Users Table (RBAC & Authentication)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
-- Master entity with CHECK constraints on prices & stock
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NULL,
    sku VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_threshold INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_products_cost_price CHECK (cost_price >= 0),
    CONSTRAINT chk_products_selling_price CHECK (selling_price >= 0),
    CONSTRAINT chk_products_current_stock CHECK (current_stock >= 0),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX idx_products_sku (sku),
    INDEX idx_products_category_id (category_id),
    INDEX idx_products_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers Table
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(25),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_suppliers_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchases Table (Inbound Intake)
CREATE TABLE purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    user_id INT NOT NULL,
    invoice_reference VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('PAID', 'PENDING', 'PARTIAL') NOT NULL DEFAULT 'PAID',
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchases_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_purchases_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_purchases_supplier (supplier_id),
    INDEX idx_purchases_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Items Table
-- Enforces ON DELETE RESTRICT on products master table
CREATE TABLE purchase_items (
    purchase_item_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_purchase_qty CHECK (quantity > 0),
    CONSTRAINT chk_purchase_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT fk_purchase_items_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_purchase_items_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Table (POS Checkout)
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    final_total DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('CASH', 'CARD', 'UPI', 'CREDIT') NOT NULL DEFAULT 'CASH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_sales_invoice (invoice_number),
    INDEX idx_sales_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sale Items Table
-- Enforces ON DELETE RESTRICT on products master table & index on sale_id
CREATE TABLE sale_items (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_sale_qty CHECK (quantity > 0),
    CONSTRAINT chk_sale_unit_price CHECK (unit_price >= 0),
    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_sale_items_sale_id (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock Transactions Table (Audit Ledger)
-- Enforces ON DELETE RESTRICT on master products
CREATE TABLE stock_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    transaction_type ENUM('PURCHASE_IN', 'SALE_OUT', 'MANUAL_ADJUSTMENT') NOT NULL,
    quantity_changed INT NOT NULL,
    balance_after INT NOT NULL,
    reference_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_transactions_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_stock_tx_product (product_id),
    INDEX idx_stock_tx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Seed Data
-- ------------------------------------------------------------------------------

-- Users:
-- Admin: admin@store.com / Admin@123
-- Staff: staff@store.com / Staff@123
INSERT INTO users (user_id, username, email, password_hash, full_name, role, is_active) VALUES
(1, 'admin', 'admin@store.com', '$2a$10$Hkg6oDgdhD6.7sNvG2UgbuGgGCrG2SN0ub7vlCj1NVc5pgn1smU5u', 'Admin Manager', 'ADMIN', 1),
(2, 'staff', 'staff@store.com', '$2a$10$yhWQTyYlyR0FNVbYGczrXulqwBgc9MPjCmyWUBHswGeAktqi1DZTi', 'Store Cashier', 'STAFF', 1)
ON DUPLICATE KEY UPDATE email=VALUES(email), password_hash=VALUES(password_hash);

-- 3 Categories
INSERT INTO categories (category_id, name, description) VALUES
(1, 'Beverages', 'Refreshing cold beverages, sodas, and juices'),
(2, 'Packaged Foods', 'Snacks, cookies, canned goods, and dry staples'),
(3, 'Personal Care', 'Hygiene essentials, soaps, and toiletries')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5 Initial Products with initial stock and thresholds
INSERT INTO products (product_id, category_id, sku, name, cost_price, selling_price, current_stock, min_stock_threshold, is_active) VALUES
(1, 1, 'BEV-COLA-500', 'Sparkling Classic Cola 500ml', 0.75, 1.50, 60, 15, 1),
(2, 1, 'BEV-OJ-1L', '100% Pure Orange Juice 1L', 1.80, 3.25, 30, 10, 1),
(3, 2, 'SNK-CHIP-BBQ', 'Smoked BBQ Kettle Potato Chips 150g', 1.10, 2.40, 45, 12, 1),
(4, 2, 'SNK-COOK-OAT', 'Oatmeal Raisin Baked Cookies 200g', 1.50, 3.00, 25, 8, 1),
(5, 3, 'PC-SOAP-ALOE', 'Moisturizing Aloe Vera Bar Soap 125g', 0.90, 2.00, 40, 10, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), selling_price=VALUES(selling_price);

-- Initial Audit Ledger entries reflecting the initial stock
INSERT INTO stock_transactions (product_id, transaction_type, quantity_changed, balance_after, reference_id) VALUES
(1, 'PURCHASE_IN', 60, 60, 'INIT-SEED-2026'),
(2, 'PURCHASE_IN', 30, 30, 'INIT-SEED-2026'),
(3, 'PURCHASE_IN', 45, 45, 'INIT-SEED-2026'),
(4, 'PURCHASE_IN', 25, 25, 'INIT-SEED-2026'),
(5, 'PURCHASE_IN', 40, 40, 'INIT-SEED-2026');
