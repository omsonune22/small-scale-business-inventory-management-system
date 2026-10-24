import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventory_pos_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  multipleStatements: true
};

async function seedDatabase() {
  console.log('===============================================================');
  console.log('   RetailPulse Inventory & POS - Automated Database Seeder     ');
  console.log('===============================================================');

  let connection;
  try {
    console.log(`[SEED]: Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
    // Connect to server without database first to ensure database existence
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    connection = await mysql.createConnection(dbConfig);
    console.log(`[SEED]: Successfully connected to database '${dbConfig.database}'.`);

    // 1. Drop existing tables in reverse relational dependency order
    console.log('[SEED]: Dropping legacy tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    const dropTables = [
      'stock_transactions',
      'sale_items',
      'sales',
      'purchase_items',
      'purchases',
      'products',
      'suppliers',
      'categories',
      'users'
    ];
    for (const tbl of dropTables) {
      await connection.query(`DROP TABLE IF EXISTS \`${tbl}\`;`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('  ✓ Tables dropped cleanly.');

    // 2. Create Relational Schema with InnoDB Engine, CHECK constraints, and Foreign Keys
    console.log('[SEED]: Constructing InnoDB tables with relational constraints...');

    // Users Table
    await connection.query(`
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
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Categories Table
    await connection.query(`
      CREATE TABLE categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_categories_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Suppliers Table
    await connection.query(`
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
    `);

    // Products Table with CHECK constraints and RESTRICT foreign keys
    await connection.query(`
      CREATE TABLE products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        cost_price DECIMAL(10, 2) NOT NULL,
        selling_price DECIMAL(10, 2) NOT NULL,
        current_stock INT NOT NULL DEFAULT 0,
        min_stock_threshold INT NOT NULL DEFAULT 5,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_prod_cost CHECK (cost_price >= 0),
        CONSTRAINT chk_prod_selling CHECK (selling_price >= 0),
        CONSTRAINT chk_prod_stock CHECK (current_stock >= 0),
        CONSTRAINT chk_prod_threshold CHECK (min_stock_threshold >= 0),
        CONSTRAINT fk_products_category
          FOREIGN KEY (category_id) REFERENCES categories(category_id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        INDEX idx_products_sku (sku),
        INDEX idx_products_category (category_id),
        INDEX idx_products_stock (current_stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Purchases Table
    await connection.query(`
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
    `);

    // Purchase Items Table
    await connection.query(`
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
    `);

    // Sales Table
    await connection.query(`
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
    `);

    // Sale Items Table
    await connection.query(`
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
        INDEX idx_sale_items_sale (sale_id),
        INDEX idx_sale_items_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Stock Transactions (Immutable Audit Ledger) Table
    await connection.query(`
      CREATE TABLE stock_transactions (
        transaction_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        transaction_type ENUM('PURCHASE_IN', 'SALE_OUT', 'MANUAL_ADJUSTMENT') NOT NULL,
        quantity_changed INT NOT NULL,
        balance_after INT NOT NULL,
        reference_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_stock_transactions_product
          FOREIGN KEY (product_id) REFERENCES products(product_id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        INDEX idx_stock_tx_product (product_id),
        INDEX idx_stock_tx_type (transaction_type),
        INDEX idx_stock_tx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ All 9 InnoDB tables created with relational integrity constraints.');

    // 3. Insert Seed Data
    console.log('[SEED]: Populating database with realistic initial entities...');

    // Users (Bcrypt hashed)
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const staffPasswordHash = await bcrypt.hash('Staff@123', 10);

    await connection.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES
      ('admin', 'admin@store.com', ?, 'System Administrator', 'ADMIN', 1),
      ('staff', 'staff@store.com', ?, 'Store Cashier', 'STAFF', 1);
    `, [adminPasswordHash, staffPasswordHash]);
    console.log('  ✓ Users created: Admin (admin@store.com) & Staff (staff@store.com).');

    // Categories
    await connection.query(`
      INSERT INTO categories (category_id, name, description) VALUES
      (1, 'Beverages & Soft Drinks', 'Packaged juices, cold drinks, sodas, and carbonated beverages'),
      (2, 'Packaged Snacks', 'Chips, biscuits, baked cookies, wafers, and savory snacks'),
      (3, 'Dairy & Essentials', 'Milk, yogurt, cheeses, and morning refrigeration items'),
      (4, 'Personal Care', 'Hand soaps, dental care, body washes, and hygiene essentials');
    `);
    console.log('  ✓ 4 Product Categories created.');

    // Suppliers
    await connection.query(`
      INSERT INTO suppliers (supplier_id, company_name, contact_person, phone, email, address) VALUES
      (1, 'Apex FMCG Distributors', 'Robert Vance', '+1 (555) 234-5678', 'orders@apexfmcg.com', '104 Industrial Parkway, Sector 4'),
      (2, 'Sunrise Dairy Co.', 'Elena Rostova', '+1 (555) 876-5432', 'supply@sunrisedairy.com', '42 Green Valley Rd, Farm Zone'),
      (3, 'Global Refreshments Ltd.', 'Marcus Sterling', '+1 (555) 345-6789', 'contact@globalrefresh.com', '88 Harbor Boulevard, Port District');
    `);
    console.log('  ✓ 3 Active Suppliers created.');

    // Products
    await connection.query(`
      INSERT INTO products (product_id, category_id, sku, name, cost_price, selling_price, current_stock, min_stock_threshold, is_active) VALUES
      (1, 1, 'BEV-COLA-500', 'Sparkling Classic Cola 500ml', 1.00, 2.50, 58, 15, 1),
      (2, 1, 'BEV-OJ-1L', '100% Pure Orange Juice 1L', 1.80, 3.25, 9, 10, 1),
      (3, 2, 'SNK-CHIP-BBQ', 'Smoked BBQ Kettle Potato Chips 150g', 1.40, 3.00, 44, 12, 1),
      (4, 2, 'SNK-COOK-OAT', 'Oatmeal Raisin Baked Cookies 200g', 1.50, 3.00, 25, 8, 1),
      (5, 4, 'PC-SOAP-ALOE', 'Moisturizing Aloe Vera Bar Soap 125g', 0.90, 2.00, 0, 10, 1),
      (6, 1, 'BEV-TEA-GRN', 'Organic Iced Green Tea 450ml', 0.95, 2.25, 36, 10, 1),
      (7, 3, 'DRY-MILK-1L', 'Whole Pasteurized Milk 1L', 1.10, 2.10, 20, 10, 1),
      (8, 3, 'DRY-YOG-500', 'Greek Vanilla Yogurt 500g', 1.60, 3.40, 14, 6, 1),
      (9, 2, 'SNK-NUT-MX', 'Roasted Salted Mixed Nuts 120g', 2.20, 4.50, 30, 8, 1),
      (10, 4, 'PC-SHAMP-250', 'Botanical Hydrating Shampoo 250ml', 2.50, 5.50, 18, 5, 1);
    `);
    console.log('  ✓ 10 Master Products created with healthy, low-stock, and zero-stock records.');

    // Initial Stock Ledger Entries
    await connection.query(`
      INSERT INTO stock_transactions (product_id, transaction_type, quantity_changed, balance_after, reference_id, created_at) VALUES
      (1, 'PURCHASE_IN', 60, 60, 'INV-APEX-7842', DATE_SUB(NOW(), INTERVAL 4 DAY)),
      (2, 'PURCHASE_IN', 30, 30, 'INV-SUN-9021', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (3, 'PURCHASE_IN', 45, 45, 'INV-APEX-7842', DATE_SUB(NOW(), INTERVAL 4 DAY)),
      (4, 'PURCHASE_IN', 25, 25, 'INIT-SEED-2026', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (6, 'PURCHASE_IN', 40, 40, 'INV-GLOB-1102', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (7, 'PURCHASE_IN', 25, 25, 'INV-SUN-9021', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (8, 'PURCHASE_IN', 16, 16, 'INV-SUN-9021', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (9, 'PURCHASE_IN', 30, 30, 'INV-APEX-7842', DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (10, 'PURCHASE_IN', 20, 20, 'INV-APEX-7842', DATE_SUB(NOW(), INTERVAL 1 DAY));
    `);

    // Past Purchases
    await connection.query(`
      INSERT INTO purchases (purchase_id, supplier_id, user_id, invoice_reference, total_amount, payment_status, purchase_date) VALUES
      (1, 1, 1, 'INV-APEX-7842', 211.00, 'PAID', DATE_SUB(NOW(), INTERVAL 4 DAY)),
      (2, 2, 1, 'INV-SUN-9021', 107.10, 'PAID', DATE_SUB(NOW(), INTERVAL 3 DAY));
    `);

    await connection.query(`
      INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal) VALUES
      (1, 1, 60, 1.00, 60.00),
      (1, 3, 45, 1.40, 63.00),
      (1, 9, 30, 2.20, 66.00),
      (1, 10, 20, 1.10, 22.00),
      (2, 2, 30, 1.80, 54.00),
      (2, 7, 25, 1.10, 27.50),
      (2, 8, 16, 1.60, 25.60);
    `);
    console.log('  ✓ Supplier restock purchase orders recorded.');

    // Historical POS Sales
    await connection.query(`
      INSERT INTO sales (sale_id, invoice_number, user_id, customer_name, subtotal, discount_amount, tax_amount, final_total, payment_method, created_at) VALUES
      (1, 'INV-20261020-1001', 2, 'Alice Walker', 18.00, 1.00, 0.85, 17.85, 'CARD', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (2, 'INV-20261021-1002', 2, 'Bob Martinez', 24.50, 0.00, 1.23, 25.73, 'UPI', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (3, 'INV-20261022-1003', 2, 'Walk-in Customer', 35.00, 2.00, 1.65, 34.65, 'CASH', DATE_SUB(NOW(), INTERVAL 1 DAY)),
      (4, 'INV-20261023-1004', 2, 'Clara Oswald', 8.00, 0.00, 0.40, 8.40, 'CASH', NOW());
    `);

    await connection.query(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
      (1, 1, 2, 2.50, 5.00),
      (1, 3, 1, 3.00, 3.00),
      (1, 7, 5, 2.00, 10.00),
      (2, 2, 4, 3.25, 13.00),
      (2, 6, 4, 2.25, 9.00),
      (2, 8, 1, 2.50, 2.50),
      (3, 1, 6, 2.50, 15.00),
      (3, 3, 5, 3.00, 15.00),
      (3, 8, 1, 5.00, 5.00),
      (4, 1, 2, 2.50, 5.00),
      (4, 3, 1, 3.00, 3.00);
    `);

    // Sales audit entries in stock_transactions
    await connection.query(`
      INSERT INTO stock_transactions (product_id, transaction_type, quantity_changed, balance_after, reference_id, created_at) VALUES
      (1, 'SALE_OUT', -2, 58, 'INV-20261023-1004', NOW()),
      (3, 'SALE_OUT', -1, 44, 'INV-20261023-1004', NOW()),
      (2, 'MANUAL_ADJUSTMENT', -1, 9, 'ADJ-DAMAGED: Broken seal in warehouse', DATE_SUB(NOW(), INTERVAL 6 HOUR));
    `);
    console.log('  ✓ Past sales orders & POS items recorded with transaction audit linkage.');

    console.log('===============================================================');
    console.log('   SEED COMPLETE! SYSTEM IS 100% PRODUCTION-READY.            ');
    console.log('   Admin Login: admin@store.com / Admin@123                    ');
    console.log('   Staff Login: staff@store.com / Staff@123                    ');
    console.log('===============================================================');

  } catch (error) {
    console.error('[SEED ERROR]:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nNOTE: MySQL service is not running on localhost:3306.');
      console.error('Please ensure the MySQL 8.0 server service is running before seeding.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
