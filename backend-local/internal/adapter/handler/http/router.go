package http

import (
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
)

func NewRouter(userSvc ports.UserService, productSvc ports.ProductService) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	authHandler := NewAuthHandler(userSvc)
	productHandler := NewProductHandler(productSvc)

	r.Post("/api/v1/login", authHandler.Login)

	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)

		r.Get("/api/v1/products", productHandler.List)
		r.Post("/api/v1/products", productHandler.Create)

		r.Post("/api/v1/scan", productHandler.Scan)
		
		r.Post("/api/v1/products/{sku}/restock", productHandler.Restock)
		r.Post("/api/v1/products/{sku}/deduct", productHandler.Deduct)
	})

	return r
}