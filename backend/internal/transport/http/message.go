package http

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Ania-Krivs/GOTracker/internal/services"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
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

func (h *WSHandler) MessageRourer() {
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
		_ = conn.WriteMessage(websocket.TextMessage, []byte("Неверный формат запроса"))
		return
	}

	cnx, cancel := context.WithCancel(r.Context())
	defer cancel()

	sendCh := make(chan string, 10)
	receiveCh := make(chan string, 1)

	writeDone := make(chan struct{})

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
		defer close(writeDone)
		for msg := range sendCh {
			_ = conn.WriteMessage(websocket.TextMessage, []byte(msg))
		}

		_ = conn.WriteMessage(
            websocket.CloseMessage, 
            websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Сессия закрыта"),
        )
	}()

	userResponse, err := h.notifService.HandleAdminMessage(cnx, req.Message, sendCh, receiveCh)
	
	if err != nil{
		sendCh <- err.Error()
	} else {
		sendCh <- "Ответ:" + userResponse
	}

	close(sendCh)

	<-writeDone

}
