package app

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/Ania-Krivs/GOTracker/internal/repository"
	"github.com/Ania-Krivs/GOTracker/internal/services"
	"github.com/Ania-Krivs/GOTracker/internal/transport/http"
)

func InitDB(user, password, name, host, port string) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, name, port,
	)
	
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func UserRouter(db *gorm.DB) {
	userRepo := repository.NewUserRepository(db)
	userService := services.NewUserService(userRepo)
	userHandler := http.NewHandler(userService)
	userHandler.InitRoutes()
}