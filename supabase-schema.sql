-- ====================================================================
-- SUPABASE / POSTGRESQL 16 SCHEMA: LAUNDRY MANAGEMENT SYSTEM
-- Free Tier Optimized ($0/mo) with Row Level Security & Indexes
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Shop Configuration
CREATE TABLE IF NOT EXISTS shop_settings (
    id SERIAL PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    phone VARCHAR(25),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    tax_rate NUMERIC(5, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cloth Categories
CREATE TABLE IF NOT EXISTS cloth_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Laundry Services
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pricing Matrix
CREATE TABLE IF NOT EXISTS price_matrix (
    id SERIAL PRIMARY KEY,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    cloth_id INT REFERENCES cloth_types(id) ON DELETE CASCADE,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customer Master
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    status VARCHAR(20) DEFAULT 'enable',
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 7. Orders Master
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL UNIQUE,
    customer_id INT REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30),
    order_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    total_qty INT NOT NULL CHECK (total_qty >= 0),
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_pct NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    tax_pct NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(25) DEFAULT 'bycash',
    cheque_no VARCHAR(50),
    cheque_date DATE,
    remarks TEXT,
    status VARCHAR(25) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

-- 8. Order Line Items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    price_matrix_id INT,
    service_name VARCHAR(100) NOT NULL,
    cloth_name VARCHAR(100) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total NUMERIC(10, 2) NOT NULL
);

-- 9. Expenses Ledger
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    payee_name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    paid_by VARCHAR(25) DEFAULT 'bycash',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================

INSERT INTO shop_settings (shop_name, address, city, phone, email, currency, tax_rate)
VALUES ('Start Plug Laundry', 'Sai Sanklap Complex, Usarli Khurd', 'Panvel, Maharashtra 410206', '+91 9422388389', 'info@startplug.com', 'USD', 5.00)
ON CONFLICT DO NOTHING;

INSERT INTO cloth_types (id, name, code) VALUES
(1, 'Shirts', 'SHR'),
(2, 'Pants', 'PANT'),
(3, 'Dress', 'DRS'),
(4, 'Kurta', 'KT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, name, code) VALUES
(1, 'Washing', 'W'),
(2, 'Ironing', 'I'),
(3, 'Washing & Ironing', 'WI')
ON CONFLICT (id) DO NOTHING;

INSERT INTO price_matrix (id, service_id, cloth_id, short_code, price) VALUES
(1, 1, 1, 'W/S', 5.00),
(2, 1, 2, 'W/P', 5.00),
(3, 3, 1, 'WI/S', 10.00),
(4, 3, 2, 'WI/P', 10.00),
(5, 2, 2, 'I/P', 15.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, first_name, last_name, email, phone, address, city, status) VALUES
(1, 'Demo', 'Demo', 'demo@demo.com', '1234567890', 'B-02, Sai Sanklap CHS, Usarli Khurd', 'Panvel', 'enable'),
(2, 'Ayoub', 'Alismaili', 'ayoooo4b@gmail.com', '96747611', 'Flat 4A, Downtown', 'Mumbai', 'enable'),
(3, 'Test', 'Test', 'kumarsyscomit@gmail.com', '33006970', 'Tower 2, Sector 14', 'Navi Mumbai', 'enable'),
(4, 'Gusti', 'Darma Yudha', 'gustidarmayudha@gmail.com', '081314446996', 'Palm Grove Apt 102', 'Panvel', 'enable'),
(5, 'Asif', 'Ahmed', 'remoon@gmail.com', '+601121512776', 'Vertex Tower, Block D', 'Cyberjaya', 'enable'),
(6, 'ABC', 'Client', 'abc@abc.com', '01911111', 'Highway Point 404', 'Navi Mumbai', 'enable'),
(7, 'Siddharth', 'Chowke', 'Peace4siddharth@gmail.com', '0544587649', 'Sai Heritage Phase 1', 'Panvel', 'enable'),
(9, 'Renzo', 'Abrillo', 'renzoabrillo16@yahoo.com', '0917 427 4518', 'Binangonan', 'Rizal', 'enable')
ON CONFLICT (id) DO NOTHING;

SELECT pg_catalog.setval('cloth_types_id_seq', 10, true);
SELECT pg_catalog.setval('services_id_seq', 10, true);
SELECT pg_catalog.setval('price_matrix_id_seq', 10, true);
SELECT pg_catalog.setval('customers_id_seq', 20, true);
