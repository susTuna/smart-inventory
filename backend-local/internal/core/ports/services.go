package ports

import (
	"context"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
)

type ProductService interface {
	//Queries
	ListProducts(ctx context.Context, page, pageSize int) ([]entity.Product, error)
	GetProduct(ctx context.Context, sku string) (*entity.Product, error)
	
	//Commands
	CreateProduct(ctx context.Context, sku, name string, price int64) error

	//Stock ops
	//Restock (inbound)
	Restock(ctx context.Context, sku string, qty int, note string, userID *string) error
	
	//DeductStock (outbound) -> need to check avail
	DeductStock(ctx context.Context, sku string, qty int, note string, userID *string) error

	//AdjustStock (Stock Opname)
	AdjustStock(ctx context.Context, sku string, realQty int, note string, userID *string) error
}