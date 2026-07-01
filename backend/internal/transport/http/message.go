package http

import (
	"encoding/json"
	"net/http"
	"github.com/Ania-Krivs/GOTracker/internal/services"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { return true }, 
}

type WSHandler struct {
	notifService services.NotificationService
}

func NewWSHandler(notifService services.NotificationService) *WSHandler {
	return &WSHandler{notifService: notifService}
}

type AdminWSRequest struct {
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

func (h *WSHandler) MessageRourer(){
	http.HandleFunc("/ws", h.ConnectUserAndTalk)
}

func (h *WSHandler) ConnectUserAndTalk(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return 
	}
	defer conn.Close() 

	_, reqBytes, err := conn.ReadMessage()
	if err != nil {
		return
	}

	var req AdminWSRequest
	if err := json.Unmarshal(reqBytes, &req); err != nil {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Ошибка: неверный формат запроса"))
		return
	}

	sendCh := make(chan string, 1)
	receiveCh := make(chan string, 1)

	go func() {
		defer close(receiveCh)
		for {
			_, msgBytes, err := conn.ReadMessage()
			if err != nil {
				return 
			}
			receiveCh <- string(msgBytes)
		}
	}()

	go func() {
		for msg := range sendCh {
			_ = conn.WriteMessage(websocket.TextMessage, []byte(msg))
		}
	}()

	userResponse, err := h.notifService.HandleAdminMessage(r.Context(), req.Message, sendCh, receiveCh)
	
	close(sendCh) 

	if err != nil {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Ошибка: "+err.Error()))
	} else {
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Ответ от юзера: "+userResponse))
	}
}