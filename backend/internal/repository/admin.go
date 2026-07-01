package repository

import (
	"context"

	"github.com/Ania-Krivs/GOTracker/internal/models"
	"gorm.io/gorm"
)

type AdminRepository interface {
	Create(ctx context.Context, admin *models.Admin) error
	FindByID(ctx context.Context, id uint) (*models.Admin, error)
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) Create(ctx context.Context, admin *models.Admin) error {
	return r.db.WithContext(ctx).Create(admin).Error
}

func (r *adminRepository) FindByID(ctx context.Context, id uint) (*models.Admin, error) {
	var admin models.Admin

	if err := r.db.WithContext(ctx).First(&admin, id).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}