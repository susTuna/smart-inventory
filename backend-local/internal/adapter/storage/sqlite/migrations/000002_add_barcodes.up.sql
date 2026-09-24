CREATE TABLE IF NOT EXISTS  product_barcodes (
    barcode TEXT PRIMARY KEY,
    sku_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sku_id) REFERENCES products(sku) ON DELETE CASCADE
);

CREATE INDEX idx_barcodes_sku ON product_barcodes(sku_id);

INSERT OR IGNORE INTO product_barcodes (barcode, sku_id) 
SELECT sku, sku FROM products;