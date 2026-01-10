package ports

import (
	"context"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
)

type ProductRepository interface {
	Save(ctx context.Context, product *entity.Product) error
	GetByID(ctx context.Context, sku string) (*entity.Product, error)
	List(ctx context.Context, limit, offset int) ([]entity.Product, error)
	
	// Transactional Logic
	AdjustStock(ctx context.Context, movement *entity.StockMovement) error
}

type UserRepository interface {
	Save(ctx context.Context, user *entity.User) error
	GetByUsername(ctx context.Context, username string) (*entity.User, error)

	GetByID(ctx context.Context, id string) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
}