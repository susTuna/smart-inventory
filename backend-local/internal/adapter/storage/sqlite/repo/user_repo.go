package repo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
)

type SQLiteUserRepo struct {
	db *sqlite.DB
}

func NewUserRepo(db *sqlite.DB) ports.UserRepository {
	return &SQLiteUserRepo{db: db}
}

func (r* SQLiteUserRepo) Save(ctx context.Context, u *entity.User) error {
	query := `
		INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query,
		u.ID, u.Username, u.PasswordHash, u.Role, u.IsActive, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to save user: %w", err)
	}
	return nil
}

func (r* SQLiteUserRepo) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	query := `
		SELECT id, username, password_hash, role, is_active, created_at, updated_at
		FROM users WHERE username = ?
	`
	return r.fetchOne(ctx, query, username)
}

func (r* SQLiteUserRepo) GetByID(ctx context.Context, id string) (*entity.User, error) {
	query := `
		SELECT id, username, password_hash, role, is_active, created_at, updated_at
		FROM users WHERE id = ?
	`
	return r.fetchOne(ctx, query, id)
}

func (r* SQLiteUserRepo) Update(ctx context.Context, u *entity.User) error {
	query := `
		UPDATE users
		SET username = ?, password_hash = ?, role = ?, is_active = ?
		WHERE id = ?
	`
	res, err := r.db.ExecContext(ctx, query,
		u.Username, u.PasswordHash, u.Role, u.IsActive, u.ID)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil	
}

func (r* SQLiteUserRepo) fetchOne(ctx context.Context, query string, args ...interface{}) (*entity.User, error) {
	row := r.db.QueryRowContext(ctx, query, args...)

	var u entity.User
	var roleStr string

	err := row.Scan(
		&u.ID,
		&u.Username,
		&u.PasswordHash,
		&roleStr,
		&u.IsActive,
		&u.CreatedAt,
		&u.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	u.Role = entity.UserRole(roleStr)
	return &u, nil
}