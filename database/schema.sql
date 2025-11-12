-- SalaBook Database Schema
-- MySQL Database Setup

CREATE DATABASE IF NOT EXISTS salabook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salabook;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Halls table
CREATE TABLE IF NOT EXISTS halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    capacity INT NOT NULL,
    cost_per_day DECIMAL(10, 2) NOT NULL,
    description TEXT,
    overview TEXT,
    suitable_for TEXT,
    facilities TEXT,
    terms TEXT,
    amenities JSON,
    image VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hall_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    notes TEXT,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM(
        'pending_payment',
        'paid_pending_review',
        'confirmed',
        'cancel_requested',
        'cancelled',
        'cancel_rejected',
        'payment_rejected'
    ) DEFAULT 'pending_payment',
    slip_name VARCHAR(255),
    slip_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancel_reason TEXT,
    cancel_requested_at TIMESTAMP NULL,
    cancel_reject_reason TEXT,
    rejected_at TIMESTAMP NULL,
    reject_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_hall_id (hall_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Availability table (stores date-specific availability for each hall)
CREATE TABLE IF NOT EXISTS availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hall_date (hall_id, date),
    INDEX idx_hall_date (hall_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing rules table (date range-based pricing)
CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE,
    INDEX idx_hall_dates (hall_id, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default halls
INSERT INTO halls (id, name, location, address, capacity, cost_per_day, description, overview, suitable_for, facilities, terms, amenities, image) VALUES
(1, 'Sala A', '📍 Near main gate', '123 Main Gate Rd, Bangkok', 100, 3500.00,
 'Spacious hall suitable for 100 guests. This hall features ample space for ceremonies, gatherings, and memorial services. With easy access from the main entrance, it offers convenience for guests and families.',
 'A spacious, well-lit hall ideal for medium to large ceremonies and community events.',
 'Weddings, memorials, workshops, seminars, and community gatherings.',
 'Tables, chairs, sound system, projector screen, basic stage, restrooms nearby.',
 'No smoking inside. Quiet hours after 9 PM. Cleaning fee may apply. Deposit required.',
 '["WiFi", "Air Conditioning", "Parking", "Projector", "Sound System"]',
 'hall-1.jpg'),
(2, 'Sala B', '📍 Behind the temple garden', '45 Garden Lane, Bangkok', 60, 2500.00,
 'Quiet environment, perfect for small ceremonies. Located in a peaceful area surrounded by greenery, this intimate hall provides a serene atmosphere for respectful gatherings and memorial services.',
 'An intimate hall located near the garden, best for small groups seeking privacy.',
 'Small memorials, workshops, meditation sessions, and family ceremonies.',
 'Chairs, portable speakers, whiteboard, fans, nearby restrooms.',
 'No loud music. Decorations must be removable without damage.',
 '["WiFi", "Parking"]',
 'hall-2.jpg'),
(3, 'Sala C', '📍 Next to parking area', '8 Parking Avenue, Bangkok', 120, 4200.00,
 'Air-conditioned hall with modern facilities. This contemporary hall offers comfort with climate control and updated amenities, ensuring a pleasant experience for all attendees regardless of weather conditions.',
 'Modern hall with AC and contemporary fixtures for comfortable events year-round.',
 'Seminars, large meetings, weddings, and community ceremonies.',
 'Air conditioning, projector, microphone, stage lighting, accessible entrance.',
 'Return equipment in original condition. Overrun fee after 10 PM.',
 '["WiFi", "Air Conditioning", "Parking", "Projector", "Sound System", "Wheelchair Access"]',
 'hall-3.jpg')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default admin user (password: admin123 - change this in production!)
-- Password hash for 'admin123' using password_hash()
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User', 'admin@salabook.com', '+66 123 456 7890', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE email=VALUES(email);

