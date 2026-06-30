package main

import (
	"log"
	"net/http"
	"os"

	"github.com/Ania-Krivs/GOTracker/internal/app"
	"github.com/joho/godotenv"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println("Предупреждение: файл .env не найден")
    }
	db, err := app.InitDB(
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
		"localhost",
		"5433",
	)
	if err != nil{
		log.Fatal("Failed to connect to DB", err)
	}

	app.UserRouter(db)

	serverPort := ":8080"
	log.Printf("Сервер успешно запущен на порту %s...", serverPort)
	
	if err := http.ListenAndServe(serverPort, nil); err != nil {
		log.Fatalf("Ошибка при запуске сервера: %v", err)
	}

}
