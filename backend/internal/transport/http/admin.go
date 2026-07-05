package http

import (
	"encoding/json"
	"net/http"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/services"
)

type AdminHandler struct {
	adminService services.AdminService
	hub *services.ClientHub
}

func NewAdminHandler(adminService services.AdminService, hub *services.ClientHub) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
		hub: hub,
	}
}

func (h *AdminHandler) AdminRouter() {
	http.HandleFunc("/admin", h.CreateAdminDispatch)
	http.HandleFunc("/admin/message", h.TriggerDuck)
}

func (h *AdminHandler) CreateAdminDispatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	h.CreateAdmin(w, r)
}

// CreateAdmin godoc
// @Summary      Создать нового администратора
// @Description  Регистрирует администратора, хеширует его пароль и сохраняет в БД
// @Tags         admin
// @Accept       json
// @Produce      json
// @Param        input body schemas.CreateAdminInput true "Данные для создания админа"
// @Success      201  {object}  models.Admin
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /admin [post]
func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var input schemas.CreateAdminInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат JSON"})
		return
	}

	admin, err := h.adminService.CreateAdmin(r.Context(), input)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(admin)
}

// TriggerDuck godoc
// @Summary      Отправка уведомления пользователю от администратора
// @Description  Проверяет, является ли пользователь подчиненным (коллаборатором) данного администратора, и отправляет ему WebSocket-уведомление SHOW_DUCK с сообщением.
// @Tags         admin
// @Accept       json
// @Produce      json
// @Param        input body      object true "Данные для триггера утки (admin_id, user_id, message)" schemaexample({"admin_id": "admin-uuid-123", "user_id": "user-uuid-456", "message": "Пора за работу!"})
// @Success      200   {string}  string            "Уведомление успешно отправлено"
// @Failure      400   {object}  map[string]string "Неверный формат JSON или отсутствуют обязательные поля"
// @Failure      403   {object}  map[string]string "Доступ запрещен (пользователь не является коллаборатором этого админа)"
// @Failure      405   {string}  string            "Метод не поддерживается (разрешен только POST)"
// @Router       /admin/message [post]
func (h *AdminHandler) TriggerDuck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

    var req struct {
		AdminID string `json:"admin_id" validate:"required"`
		UserID  string `json:"user_id" validate:"required"`
		Message string `json:"message" validate:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат JSON"})
		return
	}

	if req.AdminID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Поле admin_id обязательно"})
		return
	}

	currentAdminID := req.AdminID

	isSubordinate := h.adminService.CheckSubscription(r.Context(), currentAdminID, req.UserID)
	if !isSubordinate {
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Вы не можете отправлять уведомления не своим колабораторам"})
		return
	}

	notification := map[string]string{
		"action":  "SHOW_DUCK",
		"message": req.Message,
	}
	
	h.hub.SendToUser(req.UserID, notification)
	w.WriteHeader(http.StatusOK)
}
