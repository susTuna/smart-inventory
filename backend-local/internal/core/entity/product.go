package entity

import "time"

type Product struct {
	SKU         string    `json:"sku"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	StockQty    int       `json:"stock_qty"`
	Price       int64     `json:"price"` // IDR
	ImagePath   string    `json:"image_path,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func NewProduct(sku, name string, price int64) *Product {
	return &Product{
		SKU:       sku,
		Name:      name,
		Price:     price,
		StockQty:  0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}