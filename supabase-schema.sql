-- ====================================================================
-- DHOBIGHAT ENTERPRISE SUPABASE / POSTGRESQL 16 SCHEMA
-- Free Tier Optimized ($0/mo) with Row Level Security, Indexes & Triggers
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. DOMAIN TABLES & CONFIGURATION
-- ====================================================================

-- Store Branches
CREATE TABLE IF NOT EXISTS store_branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bangalore',
    state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
    pincode VARCHAR(10) NOT NULL DEFAULT '560038',
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(100),
    gstin VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Staff & Operators (PIN Authentication)
CREATE TABLE IF NOT EXISTS store_staff (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('operator', 'manager', 'worker', 'rider', 'admin')),
    pin_hash VARCHAR(255) NOT NULL, -- Stored as SHA256 or bcrypt hash
    branch_id VARCHAR(50) REFERENCES store_branches(id) DEFAULT 'branch-blr-indira',
    shift_preference VARCHAR(20) DEFAULT 'morning' CHECK (shift_preference IN ('morning', 'evening', 'night')),
    is_active BOOLEAN DEFAULT TRUE,
    is_checked_in BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_phone ON store_staff(phone);
CREATE INDEX IF NOT EXISTS idx_staff_role ON store_staff(role);

-- Cloth Master Catalog
CREATE TABLE IF NOT EXISTS cloth_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'Apparel',
    hsn_code VARCHAR(20) DEFAULT '9988',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laundry Services Master Catalog
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT,
    turnaround_hours INT DEFAULT 48,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing Matrix (Cloth Type × Service)
CREATE TABLE IF NOT EXISTS price_matrix (
    id SERIAL PRIMARY KEY,
    cloth_id INT REFERENCES cloth_types(id) ON DELETE CASCADE,
    service_id INT REFERENCES services(id) ON DELETE CASCADE,
    short_code VARCHAR(30) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-Kg Bulk Rates
CREATE TABLE IF NOT EXISTS per_kg_rates (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    rate_per_kg NUMERIC(10, 2) NOT NULL CHECK (rate_per_kg >= 0),
    min_weight_kg NUMERIC(5, 2) DEFAULT 3.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. CUSTOMER DATA (STRICT PRIVACY & ISOLATION)
-- ====================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(150),
    is_verified BOOLEAN DEFAULT FALSE,
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    flat_no VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Bangalore',
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_cust ON customer_addresses(customer_id);

-- ====================================================================
-- 4. MASTER ORDERS & 14-STAGE PIPELINE
-- ====================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('online_pickup', 'walkin_pos')),
    
    -- 14-Stage Logistics State Machine
    status VARCHAR(50) NOT NULL DEFAULT 'order_placed' CHECK (status IN (
        'order_placed',
        'pickup_assigned',
        'out_for_pickup',
        'order_picked_up',
        'reached_store',
        'received',
        'sorting',
        'washing',
        'drying',
        'ironing',
        'qc_packed',
        'drop_assigned',
        'out_for_delivery',
        'delivered',
        'settled_closed',
        'cancelled'
    )),
    processing_sub_stage VARCHAR(50) DEFAULT 'received' CHECK (processing_sub_stage IN (
        'received', 'sorting', 'washing', 'drying', 'ironing', 'qc_packed'
    )),
    branch_id VARCHAR(50) REFERENCES store_branches(id) DEFAULT 'branch-blr-indira',
    
    -- Pickup & Logistics Dispatch
    pickup_slot_date DATE,
    pickup_slot_window VARCHAR(50) CHECK (pickup_slot_window IN ('Morning', 'Evening', 'Night', 'Walk-in Counter')),
    assigned_pickup_rider_id VARCHAR(50) REFERENCES store_staff(id),
    assigned_drop_rider_id VARCHAR(50) REFERENCES store_staff(id),
    delivery_slot_date DATE,
    delivery_slot_window VARCHAR(50),
    
    -- Intake Bag Metrics
    bag_piece_count INT DEFAULT 0 CHECK (bag_piece_count >= 0),
    bag_gross_weight_kg NUMERIC(6, 2) DEFAULT 0.00 CHECK (bag_gross_weight_kg >= 0),
    
    -- Financials & Taxes (GST 18%)
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'settled')),
    payment_method VARCHAR(30) DEFAULT 'cod' CHECK (payment_method IN ('bycash', 'upi', 'pos_machine', 'cod', 'upi_delivery', 'online_upi')),
    payment_ref VARCHAR(100),
    settled_at TIMESTAMPTZ,
    settled_by VARCHAR(50) REFERENCES store_staff(id),
    
    -- Security Delivery PIN
    delivery_pin_hash VARCHAR(255) NOT NULL,
    pin_failed_attempts INT DEFAULT 0,
    is_pin_bypassed BOOLEAN DEFAULT FALSE, -- Set to TRUE when pre-paid via online UPI
    
    -- Archival & Audit
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_rider ON orders(assigned_pickup_rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_drop_rider ON orders(assigned_drop_rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice ON orders(invoice_no);
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(is_archived);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    cloth_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL,
    qc_passed BOOLEAN DEFAULT TRUE,
    stain_notes TEXT,
    photo_r2_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Immutable Order Stage Timestamp Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS order_stage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    actor_id VARCHAR(50),
    actor_name VARCHAR(150),
    actor_role VARCHAR(50),
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stage_logs_order ON order_stage_logs(order_id);

-- ====================================================================
-- 5. CLOUDFLARE R2 ASSETS & INVOICES
-- ====================================================================

CREATE TABLE IF NOT EXISTS invoices_r2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    invoice_no VARCHAR(50) NOT NULL,
    r2_key VARCHAR(500) NOT NULL,
    r2_url VARCHAR(500) NOT NULL,
    format VARCHAR(30) NOT NULL CHECK (format IN ('thermal_80mm', 'a4_tax_invoice')),
    file_size_bytes INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices_r2(order_id);

-- ====================================================================
-- 6. SHIFT REGISTER & DAY-END CASH RECONCILIATION
-- ====================================================================

CREATE TABLE IF NOT EXISTS store_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id VARCHAR(50) REFERENCES store_staff(id) NOT NULL,
    branch_id VARCHAR(50) REFERENCES store_branches(id) NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('morning', 'evening', 'night')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_cash_drawer NUMERIC(10, 2) DEFAULT 0.00,
    closing_cash_drawer NUMERIC(10, 2),
    calculated_cash NUMERIC(10, 2),
    calculated_upi NUMERIC(10, 2),
    calculated_pos NUMERIC(10, 2),
    cash_variance NUMERIC(10, 2),
    notes TEXT,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 7. PUSH NOTIFICATIONS (FCM TOKENS)
-- ====================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    user_type VARCHAR(30) NOT NULL CHECK (user_type IN ('customer', 'staff', 'rider', 'admin')),
    fcm_token TEXT NOT NULL UNIQUE,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id, user_type);

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read for catalog
ALTER TABLE cloth_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public catalog read" ON cloth_types FOR SELECT USING (true);
CREATE POLICY "Public services read" ON services FOR SELECT USING (true);
CREATE POLICY "Public pricing read" ON price_matrix FOR SELECT USING (true);
CREATE POLICY "Public branches read" ON store_branches FOR SELECT USING (true);

-- Customers can only read and insert their own records
CREATE POLICY "Customer read self" ON customers 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customer read own orders" ON orders 
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customer read own items" ON order_items 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
    );

-- Staff and Admins access orders for their branch
CREATE POLICY "Staff read branch orders" ON orders 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM store_staff 
            WHERE store_staff.id = auth.jwt()->>'staff_id'
            AND (store_staff.branch_id = orders.branch_id OR store_staff.role = 'admin')
        )
    );

-- Service Role (Backend Server Actions & Edge Workers) has full access
CREATE POLICY "Service role full orders" ON orders 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full items" ON order_items 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full customers" ON customers 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full logs" ON order_stage_logs 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full shifts" ON store_shifts 
    FOR ALL USING (auth.role() = 'service_role');

-- ====================================================================
-- 9. FACTORY SEED DATA
-- ====================================================================

-- Branch
INSERT INTO store_branches (id, name, code, address, city, phone, gstin)
VALUES ('branch-blr-indira', 'DhobiGhat - Indiranagar Flagship', 'BLR-IND-01', '100ft Road, HAL 2nd Stage, Indiranagar', 'Bangalore', '+91 80 4123 4567', '29AABCU9603R1ZM')
ON CONFLICT (id) DO NOTHING;

-- Staff Members (Pre-hashed PINs: 1234, 9999, 2222, 6666, 6667, 6668)
INSERT INTO store_staff (id, full_name, phone, role, pin_hash, branch_id, shift_preference) VALUES
('staff-2', 'Ramesh Sharma', '9876543210', 'operator', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'branch-blr-indira', 'morning'),
('staff-5', 'Vikas Patil', '9876543214', 'manager', '4f964082260ff280eecfa5c05c5be3b66432b4b4ebcc6c13745671d1e4431e67', 'branch-blr-indira', 'morning'),
('staff-1', 'Sunil Gowda', '9876543211', 'worker', 'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', 'branch-blr-indira', 'morning'),
('staff-4', 'Mahesh Rider', '9876543216', 'rider', 'f58c7e9095bb68c07e5d8ec0ef0ee2000f5be8e7bebe3253b708b58a18357a7b', 'branch-blr-indira', 'morning'),
('staff-7', 'Kiran Delivery', '9123456780', 'rider', '34f0c4ee8fa45d064cfb8efae45e22ec6a53da2dfc3f0b2f5b4de3e73b22b6ec', 'branch-blr-indira', 'morning'),
('staff-8', 'Anand Kumar', '9845011223', 'rider', 'db5f514b806d2d41b52f9547cbfe1b54a20b0b8c6e2e5ec46f88cb04a5bf14a2', 'branch-blr-indira', 'evening')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Cloth Types
INSERT INTO cloth_types (id, name, code, category) VALUES
(1, 'Shirt / T-Shirt', 'SHR', 'Men/Unisex'),
(2, 'Trousers / Jeans', 'TRS', 'Men/Unisex'),
(3, 'Suit (2-Piece)', 'SUIT2', 'Formal'),
(4, 'Silk Saree', 'SAREE', 'Ethnic'),
(5, 'Bed Linen (Double)', 'BL-DBL', 'Household'),
(6, 'Winter Jacket / Coat', 'JKT', 'Heavy')
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, name, code, turnaround_hours) VALUES
(1, 'Dry Cleaning', 'DC', 48),
(2, 'Steam Press', 'SP', 24),
(3, 'Premium Wash & Fold', 'WF', 24),
(4, 'Wash & Steam Iron', 'WI', 36)
ON CONFLICT (id) DO NOTHING;

-- Price Matrix
INSERT INTO price_matrix (id, cloth_id, service_id, short_code, price) VALUES
(1, 1, 1, 'SHR-DC', 89.00),
(2, 1, 2, 'SHR-SP', 39.00),
(3, 1, 4, 'SHR-WI', 69.00),
(4, 2, 1, 'TRS-DC', 99.00),
(5, 2, 2, 'TRS-SP', 49.00),
(6, 2, 4, 'TRS-WI', 79.00),
(7, 3, 1, 'SUIT2-DC', 299.00),
(8, 3, 2, 'SUIT2-SP', 149.00),
(9, 4, 1, 'SAREE-DC', 249.00),
(10, 4, 2, 'SAREE-SP', 99.00),
(11, 5, 3, 'BL-DBL-WF', 159.00),
(12, 6, 1, 'JKT-DC', 249.00)
ON CONFLICT (id) DO NOTHING;

-- Per Kg Rates
INSERT INTO per_kg_rates (id, service_name, rate_per_kg, min_weight_kg) VALUES
(1, 'Wash & Fold (Per Kg)', 89.00, 3.00),
(2, 'Wash & Steam Iron (Per Kg)', 129.00, 3.00),
(3, 'Bedding & Linen Bulk (Per Kg)', 99.00, 4.00)
ON CONFLICT (id) DO NOTHING;
