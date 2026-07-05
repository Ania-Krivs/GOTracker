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
	LoginByCode(ctx context.Context, code uint) (models.User, error)
	GetUserByID(ctx context.Context, id string) (models.User, error)
	DeleteUser(ctx context.Context, id string) error
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

func (s *userService) LoginByCode(ctx context.Context, code uint) (models.User, error) {
	user, err := s.repo.UserLogIn(ctx, code)
	if err != nil {
		return models.User{}, err
	}

	if user.ID == "" {
		return models.User{}, errors.New("пользователь с таким кодом не найден")
	}

	return user, nil
}

func (s *userService) GetUserByID(ctx context.Context, id string) (models.User, error) {
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.User{}, errors.New("Пользователь не найден")
		}
		return models.User{}, err
	}

	return user, nil
}

func (s *userService) DeleteUser(ctx context.Context, id string) error {
	_, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("Пользователь не найден")
		}
		return err
	}

	return s.repo.DeleteUser(ctx, id)
}