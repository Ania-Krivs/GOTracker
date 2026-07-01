package http

import (
	"encoding/json"
	"net/http"
	"github.com/Ania-Krivs/GOTracker/internal/services"
)

type Handler struct {
	userService services.UserService
}

func NewHandler(userService services.UserService) *Handler {
	return &Handler{userService: userService}
}

func (h *Handler) UserRouter() {
	http.HandleFunc("/users", h.GetAllUsers)
}

// GetAllUsers godoc
// @Summary      Получить всех пользователей
// @Description  Возвращает список всех пользователей из базы данных
// @Tags         users
// @Produce      json
// @Success      200  {array}   models.User  "Успешный ответ со списком пользователей"
// @Failure      500  {object}  map[string]string "Внутренняя ошибка сервера"
// @Router       /users [get]
func (h *Handler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	users, err := h.userService.GetUsers(r.Context())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(users)
}