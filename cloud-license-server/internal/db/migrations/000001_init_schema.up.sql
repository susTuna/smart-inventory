-- PostgreSQL Migration

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licenses (
    key VARCHAR(50) PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    hardware_id VARCHAR(100), -- Locked to first device
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    plan_type VARCHAR(20) DEFAULT 'BASIC', -- 'BASIC', 'PRO'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster license lookups
CREATE INDEX idx_licenses_key ON licenses(key);