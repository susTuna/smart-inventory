package service

import (
	"context"
	"errors"
	"time"

	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrBarcodeExists   = errors.New("barcode already registered")
)

type ProductService struct {
	repo ports.ProductRepository
}

func NewProductService(repo ports.ProductRepository) ports.ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) ListProducts(ctx context.Context, page, pageSize int) ([]entity.Product, error) {
	if page < 1 {
		page = 1
	}
	offset := (page - 1) *pageSize
	return s.repo.List(ctx, pageSize, offset)
}

func (s* ProductService) GetProduct(ctx context.Context, sku string) (*entity.Product, error) {
	return s.repo.GetByID(ctx, sku)
}

func (s* ProductService) GetProductByBarcode(ctx context.Context, barcode string) (*entity.Product, error) {
	product, err :=  s.repo.GetByBarcode(ctx, barcode)
	if err != nil {
		return nil, err
	}

	if product != nil {
		return product, nil
	}

	return s.repo.GetByID(ctx, barcode) //fallback for SKU == Barcode (backward compatibility)
}

func (s* ProductService) CreateProduct(ctx context.Context, sku, name string, price int64) error {
	if sku == "" || name == "" {
		return errors.New("sku and name are required")
	}
	if price < 0 {
		return errors.New("price cannot be negative")
	}

	product := entity.NewProduct(sku, name, price)

	return s.repo.Save(ctx, product)
}

func (s* ProductService) AddBarcode(ctx context.Context, sku, newBarcode string) error {
	if sku == "" || newBarcode == "" {
		return errors.New("sku and barcode are required")
	}

	product, err := s.repo.GetByID(ctx, sku)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	return s.repo.AddBarcode(ctx, sku, newBarcode)
}

func (s* ProductService) Restock(ctx context.Context, sku string, qty int, note string, userID *string) error {
	if qty <= 0 {
		return errors.New("restock quantity must be positive")
	}

	movement := &entity.StockMovement{
		SkuID: 			sku,
		UserID: 		userID,
		ChangeAmount: 	qty,
		Type: 			entity.MovementInbound,
		Note: 			note,
		CreatedAt: 		time.Now(),
	}

	return s.repo.AdjustStock(ctx, movement)
}

func (s* ProductService) DeductStock(ctx context.Context, sku string, qty int, note string, userID *string) error {
	if qty <= 0 {
		return errors.New("deduct quantity must be positive")
	}

	movement := &entity.StockMovement{
		SkuID: 			sku,
		UserID: 		userID,
		ChangeAmount: 	-qty,
		Type: 			entity.MovementOutbound,
		Note: 			note,
		CreatedAt: 		time.Now(),
	}

	return s.repo.AdjustStock(ctx, movement)
}

func (s* ProductService) AdjustStock(ctx context.Context, sku string, realQty int, note string, userID *string) error {
	if realQty <= 0 {
		return errors.New("stock quantity cannot be negative")
	}

	product, err := s.repo.GetByID(ctx, sku)
	if err != nil {
		return err
	}
	if product == nil {
		return ErrProductNotFound
	}

	diff := realQty - product.StockQty
	if diff == 0 {
		return nil
	}

	movement := &entity.StockMovement{
		SkuID: 			sku,
		UserID: 		userID,
		ChangeAmount: 	diff,
		Type: 			entity.MovementAdjustment,
		Note: 			note,
		CreatedAt: 		time.Now(),
	}

	return s.repo.AdjustStock(ctx, movement)
}
