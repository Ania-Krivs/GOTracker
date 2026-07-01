package services

import (
	"context"
	"errors"
	"math/big"
	"crypto/rand"
	"github.com/Ania-Krivs/GOTracker/internal/models"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserService interface {
	GetUsers(ctx context.Context) ([]models.User, error)
	CreateUser(ctx context.Context, input *schemas.CreateUser) (*models.User, error)
}

type userService struct {
	repo repository.UserRepository
	adminRepo repository.AdminRepository
}

func NewUserService(repo repository.UserRepository, adminRepo repository.AdminRepository) UserService {
	return &userService{
		repo: repo,
		adminRepo: adminRepo,
	}
}

func (s *userService) GetUsers(ctx context.Context) ([]models.User, error) {
	return s.repo.GetAll(ctx)
}

func (s *userService) CreateUser(ctx context.Context, input *schemas.CreateUser) (*models.User, error) {
	_, err := s.adminRepo.FindByID(ctx, input.Admin_id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Администратор не найден")
		}
		return nil, err
	}

	user := &models.User{
		Name:    input.Name,
		AdminID: &input.Admin_id,
	}

	for {
		nBig, err := rand.Int(rand.Reader, big.NewInt(9000))
		if err != nil {
			return nil, err
		}
		generatedCode := uint(nBig.Uint64() + 1000)

		exists, err := s.repo.CodeExists(ctx, generatedCode)
		if err != nil {
			return nil, err
		}

		if !exists {
			user.Code = generatedCode
			break
		}
	}

	user.ID = uuid.New().String()
	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}