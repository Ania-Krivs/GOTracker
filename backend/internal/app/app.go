package app

import (
	"fmt"
	netHttp "net/http"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/Ania-Krivs/GOTracker/internal/repository"
	"github.com/Ania-Krivs/GOTracker/internal/services"
	"github.com/Ania-Krivs/GOTracker/internal/transport/http"

	httpSwagger "github.com/swaggo/http-swagger"
)

func InitDB(user, password, name, host, port string) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, name, port,
	)
	
	return gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
}


func InitRouters(db *gorm.DB) {
	hub := services.NewClientHub()

	adminRepo := repository.NewAdminRepository(db)
	adminService := services.NewAdminService(adminRepo)
	adminHandler := http.NewAdminHandler(adminService, hub)
	adminHandler.AdminRouter()
	
	userRepo := repository.NewUserRepository(db)
	userService := services.NewUserService(userRepo, adminRepo)
	userHandler := http.NewHandler(userService)
	userHandler.UserRouter()

	http.PingRouter()

    notificationService := services.NewNotificationService()
    wsHandler := http.NewWSHandler(notificationService, hub, userService)
    wsHandler.MessageRourer()

	netHttp.HandleFunc("/swagger/", httpSwagger.Handler(
		httpSwagger.URL("http://localhost:8080/swagger/doc.json"),
	))

}

