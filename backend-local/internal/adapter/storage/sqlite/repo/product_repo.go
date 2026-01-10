package repo

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
)

type SQLiteProductRepo struct {
	db *sqlite.DB
}

func NewProductRepo(db *sqlite.DB) ports.ProductRepository {
	return &SQLiteProductRepo{db: db}
}

func (r *SQLiteProductRepo) Save(ctx context.Context, p *entity.Product) error {
	query := `
		INSERT INTO products (sku, name, description, stock_qty, price, image_path, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(sku) DO UPDATE SET
			name=excluded.name,
			description=excluded.description,
			price=excluded.price,
			image_path=excluded.image_path,
			updated_at=CURRENT_TIMESTAMP
	`
	_, err := r.db.ExecContext(ctx, query,
		p.SKU, p.Name, p.Description, p.StockQty, p.Price, p.ImagePath, p.CreatedAt, p.UpdatedAt,
	)
	return err
}

func (r *SQLiteProductRepo) GetByID(ctx context.Context, sku string) (*entity.Product, error) {
	query := `SELECT sku, name, description, stock_qty, price, image_path, created_at, updated_at FROM products WHERE sku = ?`
	
	row := r.db.QueryRowContext(ctx, query, sku)
	
	var p entity.Product
	// We handle potential NULLs for description/image_path using sql.NullString if needed, 
	// but for simplicity here assume schema NOT NULL or empty string default handling in struct.
	var desc, img sql.NullString 
	
	err := row.Scan(&p.SKU, &p.Name, &desc, &p.StockQty, &p.Price, &img, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, err
	}
	
	p.Description = desc.String
	p.ImagePath = img.String
	return &p, nil
}

func (r *SQLiteProductRepo) List(ctx context.Context, limit, offset int) ([]entity.Product, error) {
	query := `SELECT sku, name, description, stock_qty, price, image_path, created_at, updated_at FROM products LIMIT ? OFFSET ?`
	
	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []entity.Product
	for rows.Next() {
		var p entity.Product
		var desc, img sql.NullString
		if err := rows.Scan(&p.SKU, &p.Name, &desc, &p.StockQty, &p.Price, &img, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.Description = desc.String
		p.ImagePath = img.String
		products = append(products, p)
	}
	return products, nil
}

// AdjustStock performs a transaction:
// 1. Updates products.stock_qty
// 2. Inserts into stock_movements
func (r *SQLiteProductRepo) AdjustStock(ctx context.Context, m *entity.StockMovement) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	// Defer rollback in case of panic or error (if commit wasn't called)
	defer tx.Rollback()

	// 1. Update Product Stock
	updateQuery := `UPDATE products SET stock_qty = stock_qty + ? WHERE sku = ?`
	res, err := tx.ExecContext(ctx, updateQuery, m.ChangeAmount, m.SkuID)
	if err != nil {
		return fmt.Errorf("failed to update stock: %w", err)
	}
	
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("product not found: %s", m.SkuID)
	}

	// 2. Insert Movement Log
	insertQuery := `
		INSERT INTO stock_movements (sku_id, user_id, change_amount, type, reference_id, note, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.ExecContext(ctx, insertQuery,
		m.SkuID, m.UserID, m.ChangeAmount, m.Type, m.ReferenceID, m.Note, time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to create movement log: %w", err)
	}

	// 3. Commit Transaction
	return tx.Commit()
}