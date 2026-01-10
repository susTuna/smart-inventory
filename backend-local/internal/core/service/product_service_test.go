package service_test

import (
	"context"
	"testing"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/service"
)

// SetupServiceIntegration creates a real in-memory stack (DB -> Repo -> Service)
func SetupServiceIntegration(t *testing.T) (*sqlite.DB, service.ProductService) {
	db, err := sqlite.NewConnection(":memory:")
	if err != nil {
		t.Fatalf("Failed to open test db: %v", err)
	}

	// 1. Run Schema (Same as before)
	schema := `
	PRAGMA foreign_keys = ON;
	CREATE TABLE products (
		sku TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT,
		stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0), -- The Constraint
		price INTEGER NOT NULL DEFAULT 0,
		image_path TEXT,
		created_at DATETIME,
		updated_at DATETIME
	);
	CREATE TABLE stock_movements (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sku_id TEXT NOT NULL,
		user_id TEXT,
		change_amount INTEGER NOT NULL,
		type TEXT NOT NULL,
		reference_id TEXT,
		note TEXT,
		created_at DATETIME,
		FOREIGN KEY (sku_id) REFERENCES products(sku)
	);
	`
	if err := db.ExecuteMigration(context.Background(), schema); err != nil {
		t.Fatalf("Migration failed: %v", err)
	}

	// 2. Wire up dependencies
	productRepo := repo.NewProductRepo(db)
	productService := service.NewProductService(productRepo)

	// We cast back to struct to access methods, though in real app we use interface
	// In tests, we are testing the concrete implementation usually.
	return db, *productService.(*service.ProductService)
}

func TestDeductStock_EnforcesConstraint(t *testing.T) {
	db, svc := SetupServiceIntegration(t)
	defer db.Close()
	ctx := context.Background()

	// 1. Create Product
	err := svc.CreateProduct(ctx, "SKU-TEST", "Test Item", 5000)
	if err != nil {
		t.Fatalf("CreateProduct failed: %v", err)
	}

	// 2. Restock 5
	err = svc.Restock(ctx, "SKU-TEST", 5, "Initial", nil)
	if err != nil {
		t.Fatalf("Restock failed: %v", err)
	}

	// 3. Deduct 3 (Should Succeed)
	err = svc.DeductStock(ctx, "SKU-TEST", 3, "Sales 1", nil)
	if err != nil {
		t.Errorf("Valid deduction failed: %v", err)
	}

	// 4. Deduct 3 again (Should Fail - Stock is 2, requesting 3)
	err = svc.DeductStock(ctx, "SKU-TEST", 3, "Sales 2", nil)
	if err == nil {
		t.Error("Expected error due to insufficient stock, got nil")
	} else {
		// Optional: Check if error message mentions constraint
		t.Logf("Got expected error: %v", err)
	}

	// 5. Verify Final Stock is 2
	p, _ := svc.GetProduct(ctx, "SKU-TEST")
	if p.StockQty != 2 {
		t.Errorf("Expected stock 2, got %d", p.StockQty)
	}
}