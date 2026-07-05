package services

import (
	"context"
	"errors"
	"time"

	"sync"
	"github.com/gorilla/websocket"
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


type ClientHub struct {
	mu      sync.RWMutex
	clients map[string]*websocket.Conn
	admins  map[string]*websocket.Conn
}

func NewClientHub() *ClientHub {
	return &ClientHub{
		clients: make(map[string]*websocket.Conn),
		admins:  make(map[string]*websocket.Conn),
	}
}

func (h *ClientHub) RegisterUser(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[userID] = conn
}

func (h *ClientHub) UnregisterUser(userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conn, exists := h.clients[userID]; exists {
		conn.Close()
		delete(h.clients, userID)
	}
}

func (h *ClientHub) SendToUser(userID string, message interface{}) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	conn, exists := h.clients[userID]
	if !exists {
		return false 
	}

	err := conn.WriteJSON(message)
	return err == nil
}

func (h *ClientHub) RegisterAdmin(adminID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.admins[adminID] = conn
}

func (h *ClientHub) UnregisterAdmin(adminID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conn, exists := h.admins[adminID]; exists {
		conn.Close()
		delete(h.admins, adminID)
	}
}

func (h *ClientHub) SendToAdmin(adminID string, message interface{}) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	
	conn, exists := h.admins[adminID]
	if !exists {
		return false
	}
	err := conn.WriteJSON(message)
	return err == nil
}