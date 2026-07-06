package repository

import (
	"context"
	"errors"

	"github.com/Ania-Krivs/GOTracker/internal/models"
	"gorm.io/gorm"
)

type AdminRepository interface {
	Create(ctx context.Context, admin *models.Admin) error
	FindByID(ctx context.Context, id string) (*models.Admin, error)
	CheckSubscription(ctx context.Context, adminID string, userID string) bool
	FindByEmail(ctx context.Context, email string) (*models.Admin, error)
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

func (r *adminRepository) FindByID(ctx context.Context, id string) (*models.Admin, error) {
	var admin models.Admin

	if err := r.db.WithContext(ctx).First(&admin, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &admin, nil
}

func (r *adminRepository) CheckSubscription(ctx context.Context, adminID string, userID string) bool {
    var count int64
    r.db.Model(&models.User{}).Where("id = ? AND admin_id = ?", userID, adminID).Count(&count)
    return count > 0
}

func (r *adminRepository) FindByEmail(ctx context.Context, email string) (*models.Admin, error) {
    var admin models.Admin
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&admin).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, err
    }
    return &admin, nil
}