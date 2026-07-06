package services

import (
	"context"
	"errors"

	"github.com/Ania-Krivs/GOTracker/internal/models"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"github.com/google/uuid"
)

type AdminService interface {
	CreateAdmin(ctx context.Context, input schemas.CreateAdminInput) (*models.Admin, bool, error)
	CheckSubscription(ctx context.Context, adminID string, userID string) bool
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) CreateAdmin(ctx context.Context, input schemas.CreateAdminInput) (*models.Admin, bool, error) {
    existingAdmin, err := s.repo.FindByEmail(ctx, input.Email)
    if err != nil {
        return nil, false, err
    }

    if existingAdmin != nil {
        err := bcrypt.CompareHashAndPassword([]byte(existingAdmin.HashPassword), []byte(input.Password))
        if err != nil {
            return nil, false, errors.New("неверный пароль или email")
        }
        return existingAdmin, false, nil 
    }

    hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, false, err
    }

    newAdmin := &models.Admin{
        ID:           uuid.New().String(),
        Name:         input.Name,
        Email:        input.Email,
        HashPassword: string(hashedBytes),
    }

    if err := s.repo.Create(ctx, newAdmin); err != nil {
        return nil, false, err
    }

    return newAdmin, true, nil
}

func (s *adminService) CheckSubscription(ctx context.Context, adminID string, userID string) bool {
	return s.repo.CheckSubscription(ctx, adminID, userID)
}