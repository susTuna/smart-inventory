package service_test

import (
	"context"
	"testing"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/service"
)

func SetupServiceIntegration(t *testing.T) (*sqlite.DB, service.ProductService) {
	db, err := sqlite.NewConnection(":memory:")
	if err != nil {
		t.Fatalf("Failed to open test db: %v", err)
	}

	productRepo := repo.NewProductRepo(db)
	productService := service.NewProductService(productRepo)

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