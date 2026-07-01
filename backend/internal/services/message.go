package services

import (
	"context"
	"errors"
	"time"
)

type NotificationService interface {
	HandleAdminMessage(ctx context.Context, messageToUser string, sendCh chan<- string, receiveCh <-chan string) (string, error)
}

type notificationService struct{}

func NewNotificationService() NotificationService {
	return &notificationService{}
}

func (s *notificationService) HandleAdminMessage(
	ctx context.Context, 
	messageToUser string, 
	sendCh chan<- string, 
	receiveCh <-chan string,
) (string, error) {
	
	ctx, cancel := context.WithTimeout(ctx, 30*time.Minute)
	defer cancel()

	sendCh <- messageToUser

	select {
	case userResponse := <-receiveCh:
		return userResponse, nil

	case <-ctx.Done():
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return "", errors.New("время ожидания ответа от пользователя истекло")
		}
		return "", ctx.Err()
	}
}