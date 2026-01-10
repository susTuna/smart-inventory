package service_test

import (
	"context"
	"testing"

	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
	"github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/service"
)

// SetupUserServiceIntegration initializes DB and Service for User tests
func SetupUserServiceIntegration(t *testing.T) (*sqlite.DB, *service.UserService) {
	db, err := sqlite.NewConnection(":memory:")
	if err != nil {
		t.Fatalf("Failed to open test db: %v", err)
	}

	// Minimal Schema for Users
	schema := `
	CREATE TABLE users (
		id TEXT PRIMARY KEY,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL DEFAULT 'STAFF',
		is_active BOOLEAN NOT NULL DEFAULT 1,
		created_at DATETIME,
		updated_at DATETIME
	);
	`
	if err := db.ExecuteMigration(context.Background(), schema); err != nil {
		t.Fatalf("Migration failed: %v", err)
	}

	userRepo := repo.NewUserRepo(db)
	userService := service.NewUserService(userRepo)

	return db, userService.(*service.UserService)
}

func TestUserRegistrationAndLogin(t *testing.T) {
	db, svc := SetupUserServiceIntegration(t)
	defer db.Close()
	ctx := context.Background()

	// 1. Register a new Admin
	err := svc.Register(ctx, "admin", "secret123", entity.RoleAdmin)
	if err != nil {
		t.Fatalf("Registration failed: %v", err)
	}

	// 2. Attempt Duplicate Registration (Should Fail)
	err = svc.Register(ctx, "admin", "otherpass", entity.RoleStaff)
	if err != service.ErrUserAlreadyExists {
		t.Errorf("Expected ErrUserAlreadyExists, got %v", err)
	}

	// 3. Login Success
	user, err := svc.Login(ctx, "admin", "secret123")
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if user.Role != entity.RoleAdmin {
		t.Errorf("Expected role ADMIN, got %v", user.Role)
	}
	if user.PasswordHash == "secret123" {
		t.Error("Security Alert: Password stored in plain text!")
	}

	// 4. Login Wrong Password
	_, err = svc.Login(ctx, "admin", "wrongpass")
	if err != service.ErrInvalidCredentials {
		t.Errorf("Expected ErrInvalidCredentials, got %v", err)
	}

	// 5. Login Non-Existent
	_, err = svc.Login(ctx, "ghost", "123")
	if err != service.ErrInvalidCredentials {
		t.Errorf("Expected ErrInvalidCredentials for non-existent user, got %v", err)
	}
}

func TestInactiveUserLogin(t *testing.T) {
	db, svc := SetupUserServiceIntegration(t)
	defer db.Close()
	ctx := context.Background()

	// 1. Register
	svc.Register(ctx, "staff01", "pass", entity.RoleStaff)

	// 2. Manually Deactivate User in DB (Simulating Admin Action)
	_, err := db.Exec("UPDATE users SET is_active = 0 WHERE username = 'staff01'")
	if err != nil {
		t.Fatalf("Failed to deactivate user: %v", err)
	}

	// 3. Attempt Login
	_, err = svc.Login(ctx, "staff01", "pass")
	if err == nil {
		t.Error("Expected error for inactive user, got nil")
	} else if err.Error() != "account is inactive" {
		t.Errorf("Unexpected error message: %v", err)
	}
}