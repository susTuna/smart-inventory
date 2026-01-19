package sqlite

import (
	"database/sql"
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/mattn/go-sqlite3"
)

var migrationsFS embed.FS

type DB struct {
	*sql.DB
}

func NewConnection(dbName string) (*DB, error) {
	dir := filepath.Dir(dbName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	dsn := fmt.Sprintf("file:%s?mode=rwc&_journal_mode=WAL&_foreign_keys=on", dbName)
	
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Connected to local database: %s", dbName)

	if err := ExecuteMigration(db); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}
	
	return &DB{db}, nil
}

func (d *DB) Close() {
	if err := d.DB.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}
}

func ExecuteMigration(db *sql.DB) error {
	driver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to create iofs driver: %w", err)
	}

	dbDriver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("failed to create db driver: %w", err)
	}

	m, err := migrate.NewWithInstance(
		"iofs", driver, "sqlite3", dbDriver,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrator: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to execute migrations: %w", err)
	}

	log.Println("Database migrations executed successfully")
	return nil
}
