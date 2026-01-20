package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/susTuna/smart-inventory/cloud-license/internal/handler"
	mg "github.com/susTuna/smart-inventory/cloud-license/internal/db"
)

func main() {
	log.Println("Starting Cloud Licensing Server...")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatalf("Could not find DATABASE_URL")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}

	if err := mg.RunMigrations(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	handler := handler.NewLicenseHandler(db)
	r.Post("/api/v1/heartbeat", handler.Heartbeat)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "9000"
	} // default fallback
	log.Printf("License Server Starting on :%s", port)
	http.ListenAndServe(":"+port, r)
}