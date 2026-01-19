package main

import (
	"context"
	"log"
	"net/http"
	
	httpHandler "github.com/susTuna/smart-inventory/backend-local/internal/adapter/handler/http"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/service"
)

func main() {
	log.Println("Starting Smart Inventory Backend...")

	db, err := sqlite.NewConnection("inventory.db")
	if err != nil {
		log.Fatal("Could not connect to DB: %w", err)
	}
	defer db.Close()

	userRepo := repo.NewUserRepo(db)
	productRepo := repo.NewProductRepo(db)

	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo)

	_ = userService.Register(context.Background(), "admin", "admin123", entity.RoleAdmin)

	r := httpHandler.NewRouter(userService, productService)

	log.Println("Server listening on :18080")
	if err := http.ListenAndServe(":18080", r); err != nil {
		log.Fatalf("Server errorl: %v", err)
	}
}