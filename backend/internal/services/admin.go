package services

import (
	"context"
	"github.com/Ania-Krivs/GOTracker/internal/models"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"github.com/google/uuid"
)

type AdminService interface {
	CreateAdmin(ctx context.Context, input schemas.CreateAdminInput) (*models.Admin, error)
	CheckSubscription(ctx context.Context, adminID string, userID string) bool
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) CreateAdmin(ctx context.Context, input schemas.CreateAdminInput) (*models.Admin, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	admin := &models.Admin{
		ID:           uuid.New().String(),
		Name:         input.Name,
		Email:        input.Email,
		HashPassword: string(hashedBytes),
	}
	
	if err := s.repo.Create(ctx, admin); err != nil {
		return nil, err
	}

	return admin, nil
}

func (s *adminService) CheckSubscription(ctx context.Context, adminID string, userID string) bool {
	return s.repo.CheckSubscription(ctx, adminID, userID)
}