PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS products (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    price INTEGER NOT NULL DEFAULT 0,
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku_id TEXT NOT NULL,
    change_amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    reference_id TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    FOREIGN KEY (sku_id) REFERENCES products(sku) ON DELETE RESTRICT
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_movements_sku ON stock_movements(sku_id);
CREATE INDEX idx_movements_date ON stock_movements(created_at);

CREATE TABLE IF NOT EXISTS marketplace_orders (
    order_id TEXT PRIMARY KEY,
    marketplace TEXT NOT NULL,
    status TEXT NOT NULL,
    buyer_name TEXT,
    total_amount INTEGER,
    raw_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON marketplace_orders(status);

CREATE TABLE IF NOT EXISTS sync_logs (
    marketplace TEXT PRIMARY KEY,
    last_sync_status TEXT,
    last_sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_products_updated_at
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE sku = OLD.sku;
END;

CREATE TRIGGER IF NOT EXISTS trigger_orders_updated_at
AFTER UPDATE ON marketplace_orders
BEGIN
    UPDATE marketplace_orders SET updated_at = CURRENT_TIMESTAMP WHERE order_id = OLD.order_id;
END;