package repo_test

import (
	"context"
	"testing"
	"time"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
)

func SetupTestDB(t *testing.T) *sqlite.DB {
	// :memory: creates a temporary DB in RAM
	db, err := sqlite.NewConnection(":memory:")
	if err != nil {
		t.Fatalf("Failed to open test db: %v", err)
	}

	return db
}

func TestProductLifecycle(t *testing.T) {
	db := SetupTestDB(t)
	defer db.Close()

	r := repo.NewProductRepo(db)
	ctx := context.Background()

	// 1. Create Product
	prod := entity.NewProduct("SKU-001", "Indomie Goreng", 3500)
	err := r.Save(ctx, prod)
	if err != nil {
		t.Fatalf("Failed to save product: %v", err)
	}

	// 2. Adjust Stock (INBOUND +10)
	movementIn := &entity.StockMovement{
		SkuID:        "SKU-001",
		ChangeAmount: 10,
		Type:         entity.MovementInbound,
		Note:         "Initial Stock",
		CreatedAt:    time.Now(),
	}
	err = r.AdjustStock(ctx, movementIn)
	if err != nil {
		t.Fatalf("Failed to inbound stock: %v", err)
	}

	// 3. Adjust Stock (OUTBOUND -3)
	movementOut := &entity.StockMovement{
		SkuID:        "SKU-001",
		ChangeAmount: -3,
		Type:         entity.MovementOutbound,
		Note:         "Sold to customer",
		CreatedAt:    time.Now(),
	}
	err = r.AdjustStock(ctx, movementOut)
	if err != nil {
		t.Fatalf("Failed to outbound stock: %v", err)
	}

	// 4. Verify Final State
	savedProd, err := r.GetByID(ctx, "SKU-001")
	if err != nil {
		t.Fatalf("Failed to get product: %v", err)
	}

	expectedQty := 7 // 0 + 10 - 3
	if savedProd.StockQty != expectedQty {
		t.Errorf("Expected stock %d, got %d", expectedQty, savedProd.StockQty)
	}

	// 5. Verify Transaction integrity (Should fail for non-existent product)
	badMovement := &entity.StockMovement{
		SkuID:        "GHOST-SKU",
		ChangeAmount: 100,
	}
	err = r.AdjustStock(ctx, badMovement)
	if err == nil {
		t.Error("Expected error when updating non-existent product, got nil")
	}
}