package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

// NewConnection initializes the SQLite database and ensures the file exists.
// It also sets crucial PRAGMA settings for performance and safety.
func NewConnection(dbName string) (*DB, error) {
	// 1. Ensure the directory exists
	dir := filepath.Dir(dbName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	// 2. Open Connection
	// mode=rwc: Read-Write-Create
	// _journal_mode=WAL: Write-Ahead Logging (Better concurrency for our background sync)
	// _foreign_keys=on: Enforce integrity
	dsn := fmt.Sprintf("file:%s?mode=rwc&_journal_mode=WAL&_foreign_keys=on", dbName)
	
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// 3. Verify Connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Connected to local database: %s", dbName)
	
	return &DB{db}, nil
}

// Close closes the database connection
func (d *DB) Close() {
	if err := d.DB.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}
}

// ExecuteMigration is a helper to run the SQL file (Simple approach for MVP)
// In production, we might use 'golang-migrate' library.
func (d *DB) ExecuteMigration(ctx context.Context, sqlScript string) error {
	_, err := d.ExecContext(ctx, sqlScript)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	return nil
}