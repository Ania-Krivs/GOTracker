package http

import (
	"encoding/json"
	"net/http"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/services"
)

type AdminHandler struct {
	adminService services.AdminService
}

func NewAdminHandler(adminService services.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminService}
}

func (h *AdminHandler) AdminRouter() {
	http.HandleFunc("/admin", h.CreateAdminDispatch)
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