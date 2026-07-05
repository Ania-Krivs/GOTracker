package http

import (
	// "context"
	// "encoding/json"
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
	hub 		 *services.ClientHub
    userService  services.UserService
}

func NewWSHandler(notifService services.NotificationService, hub *services.ClientHub, userService services.UserService) *WSHandler {
	return &WSHandler{
		notifService: notifService,
		hub: hub,
        userService: userService,
	}
}

type AdminWSRequest struct {
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

func (h *WSHandler) MessageRourer() {
	http.HandleFunc("/ws/user", h.SubscribeNotifications)
    http.HandleFunc("/ws/admin", h.ConnectAdmin)

}

func (h *WSHandler) SubscribeNotifications(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("user_id")
    if userID == "" {
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    h.hub.RegisterUser(userID, conn)
    
    defer func() {
        h.hub.UnregisterUser(userID)
    }()

    for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		userReply := string(msgBytes)

		user, err := h.userService.GetUserByID(r.Context(), userID)
		if err != nil {
			return 
		}

		targetAdminID := *user.AdminID 

		replyToAdmin := map[string]string{
			"event":      "USER_REPLY",
			"user_id":    userID,
			"user_name":  user.Name,
			"text_reply": userReply,
		}

		adminOnline := h.hub.SendToAdmin(targetAdminID, replyToAdmin)
		
		if !adminOnline {
			println(targetAdminID, "сейчас оффлайн")
		}
    }
}


func (h *WSHandler) ConnectAdmin(w http.ResponseWriter, r *http.Request) {
	adminID := r.URL.Query().Get("admin_id")
	if adminID == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	h.hub.RegisterAdmin(adminID, conn)

	defer func() {
		h.hub.UnregisterAdmin(adminID)
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}
