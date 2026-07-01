package repository

import (
	"context"
	"github.com/Ania-Krivs/GOTracker/internal/models"
	"gorm.io/gorm"
)


type UserRepository interface {
	GetAll(ctx context.Context) ([]models.User, error)
	Create(ctx context.Context, user *models.User) error
	CodeExists(ctx context.Context, code uint) (bool, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetAll(ctx context.Context) ([]models.User, error) {
	var users []models.User
	if err := r.db.WithContext(ctx).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {

	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) CodeExists(ctx context.Context, code uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).Where("code = ?", code).Count(&count).Error
	return count > 0, err
}