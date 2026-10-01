-- ==========================================================
-- Rental & Tenant Expense Management System (7 Rooms, 2 Floors)
-- Database: MySQL 8.0+
-- ==========================================================

CREATE DATABASE IF NOT EXISTS rental_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rental_management;

-- Disable FK checks temporarily for safe setup
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS monthly_room_bills;
DROP TABLE IF EXISTS monthly_utility_batches;
DROP TABLE IF EXISTS tenant_settlements;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------
-- 0. USERS / ADMIN AUTH TABLE (Bcrypt Security & Roles)
-- ----------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER') DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ----------------------------------------------------------
-- 1. ROOMS TABLE (Static 7-Room Setup)
-- ----------------------------------------------------------
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE, -- e.g., '101', '102', '103', '104', '201', '202', '203'
    floor_number TINYINT NOT NULL,          -- 1 or 2
    base_rent DECIMAL(10, 2) NOT NULL,      -- Individual fixed monthly rent
    is_occupied BOOLEAN DEFAULT FALSE,
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_floor (floor_number),
    INDEX idx_occupied (is_occupied)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 2. TENANTS TABLE
-- ----------------------------------------------------------
CREATE TABLE tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    move_in_date DATE NOT NULL,
    security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    emergency_contact VARCHAR(100) DEFAULT NULL,
    id_proof_number VARCHAR(50) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    vacated_at DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    INDEX idx_active_tenant (is_active),
    INDEX idx_room_tenant (room_id, is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 3. MONTHLY UTILITY BATCHES (Building/Master Entry)
-- ----------------------------------------------------------
CREATE TABLE monthly_utility_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    billing_month VARCHAR(7) NOT NULL UNIQUE, -- Format: 'YYYY-MM' (e.g. '2026-10')
    total_electricity_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_water_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    common_maintenance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    occupied_rooms_count INT NOT NULL DEFAULT 0,
    per_room_electricity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    per_room_water DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    per_room_maintenance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_billing_month (billing_month)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 4. MONTHLY ROOM BILLS (Calculated Per Room Ledger Entry)
-- ----------------------------------------------------------
CREATE TABLE monthly_room_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    billing_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    
    -- Cost Breakdowns
    base_rent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    electricity_share DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    water_share DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    maintenance_share DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    carried_forward_dues DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Unpaid from previous months
    
    -- Calculated Totals & Tracking
    total_payable DECIMAL(10, 2) NOT NULL, -- base_rent + electricity + water + maintenance + carried_forward_dues
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_payable - amount_paid) STORED,
    
    -- Individual Category Statuses
    rent_status ENUM('PAID', 'PENDING') DEFAULT 'PENDING',
    electricity_status ENUM('PAID', 'PENDING') DEFAULT 'PENDING',
    water_status ENUM('PAID', 'PENDING') DEFAULT 'PENDING',
    
    -- Overall Bill Status
    payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID') DEFAULT 'UNPAID',
    due_date DATE NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (batch_id) REFERENCES monthly_utility_batches(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_room_month (room_id, billing_month),
    INDEX idx_bill_status (payment_status),
    INDEX idx_tenant_month (tenant_id, billing_month)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 5. PAYMENT HISTORY LOGS (Cash, UPI, Bank Transfer)
-- ----------------------------------------------------------
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    tenant_id INT NOT NULL,
    room_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_mode ENUM('UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE') NOT NULL DEFAULT 'UPI',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_reference VARCHAR(100) DEFAULT NULL, -- UPI UTR or receipt number
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES monthly_room_bills(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    INDEX idx_payment_tenant (tenant_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 6. TENANT VACATING & SETTLEMENT WORKFLOW
-- ----------------------------------------------------------
CREATE TABLE tenant_settlements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    room_id INT NOT NULL,
    vacate_date DATE NOT NULL,
    security_deposit_held DECIMAL(10, 2) NOT NULL,
    pending_dues_deducted DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    damage_or_repair_deducted DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_refundable_amount DECIMAL(10, 2) NOT NULL, -- Can be negative if tenant owes more than deposit
    refund_status ENUM('REFUNDED', 'RECOVERED_FROM_TENANT', 'SETTLED_ZERO') NOT NULL,
    settlement_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================================
-- SEED DATA: 7 ROOMS ACROSS 2 FLOORS
-- ==========================================================
-- 1st Floor: 4 Rooms (101 - 104)
-- 2nd Floor: 3 Rooms (201 - 203)
INSERT INTO rooms (room_number, floor_number, base_rent, is_occupied, description) VALUES
('101', 1, 8500.00, TRUE,  '1st Floor Deluxe Single - Street Facing Balcony'),
('102', 1, 7500.00, TRUE,  '1st Floor Standard Room - Attached Bath'),
('103', 1, 9000.00, TRUE,  '1st Floor Master Bedroom - Extended Closet & Bath'),
('104', 1, 7000.00, FALSE, '1st Floor Compact Room - Shared Corridor Bath'),
('201', 2, 10500.00, TRUE, '2nd Floor Terrace Suite - Private Terrace View'),
('202', 2, 8000.00, TRUE,  '2nd Floor Double Bed Room - Attached Bath'),
('203', 2, 8500.00, FALSE, '2nd Floor Corner Room - East Sun Facing');

-- SEED DATA: CURRENT OCCUPIED TENANTS
INSERT INTO tenants (room_id, full_name, phone_number, whatsapp_number, move_in_date, security_deposit, is_active) VALUES
(1, 'Aarav Sharma',     '9876543210', '919876543210', '2026-01-10', 17000.00, TRUE),
(2, 'Priya Patel',      '9811122233', '919811122233', '2026-02-01', 15000.00, TRUE),
(3, 'Rohan Verma',      '9822334455', '919822334455', '2025-11-15', 18000.00, TRUE),
(5, 'Siddharth Iyer',   '9733445566', '919733445566', '2026-03-01', 21000.00, TRUE),
(6, 'Ananya Deshmukh',  '9944556677', '919944556677', '2026-02-15', 16000.00, TRUE);

-- SEED DATA: DEFAULT ADMIN USER
-- Email: admin@aerorent.com | Password: password123 / admin123
INSERT INTO users (name, email, password_hash, role) VALUES
('Property Admin', 'admin@aerorent.com', '$2b$10$mpyyVTje6l8NzRwDqSs0o.xruU.c2dj25k77Qj67C7EbzdbNsDaVu', 'ADMIN');


