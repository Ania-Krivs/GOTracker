package repository

import (
	"context"
	"github.com/Ania-Krivs/GOTracker/internal/models"
	"gorm.io/gorm"
)


type UserRepository interface {
	GetAll(ctx context.Context) ([]models.User, error)
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