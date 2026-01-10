package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserAlreadyExists = errors.New("username already exists")
	ErrInvalidCredentials = errors.New("invalid username or password")
)

type UserService struct {
	repo ports.UserRepository
}

func NewUserService(repo ports.UserRepository) ports.UserService {
	return &UserService{repo: repo}
}

func (s* UserService) Register(ctx context.Context, username, password string, role entity.UserRole) error {
	existing, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		return err
	}

	if existing != nil {
		return ErrUserAlreadyExists
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &entity.User{
		ID:	uuid.New().String(),
		Username: username,
		PasswordHash: string(hashedBytes),
		Role: role,
		IsActive: true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.repo.Save(ctx, user)
}

func (s* UserService) Login(ctx context.Context, username, password string) (*entity.User, error) {
	user, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, errors.New("account is inactive")
	}

	return user, nil
}