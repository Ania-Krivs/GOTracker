package http

import (
	"encoding/json"
	"net/http"

	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/services"
)

type Handler struct {
	userService services.UserService
}

func NewHandler(userService services.UserService) *Handler {
	return &Handler{userService: userService}
}

func (h *Handler) UserRouter() {
	http.HandleFunc("GET /users", h.GetAllUsers)
	http.HandleFunc("POST /users", h.CreateUser)
	http.HandleFunc("POST /users/login", h.UserLogIn)
	http.HandleFunc("DELETE /users", h.DeleteUser)
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

// CreateUser godoc
// @Summary      Создание пользователя админом
// @Description  Принимает данные нового пользователя, привязывает к существующему админу и возвращает созданный объект
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        input body     schemas.CreateUser true  "Данные пользователя (передай name и admin_id)"
// @Success      201   {object} models.User       "Пользователь успешно создан"
// @Failure      400   {object} map[string]string "Неверный формат JSON или админ не найден"
// @Failure      500   {object} map[string]string "Внутренняя ошибка сервера"
// @Router       /users [post]
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	var input schemas.CreateUser
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат JSON тела запроса"})
		return
	}

	user, err := h.userService.CreateUser(r.Context(), &input)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(user)
}

// UserLogIn godoc
// @Summary      Вход пользователя по коду от администратора
// @Description  Принимает код входа, проверяет его и возвращает данные пользователя для последующего WS-подключения
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        input body      schemas.LoginByCode true  "Код входа пользователя"
// @Success      200   {object}  models.User                "Пользователь успешно вошёл"
// @Failure      400   {object}  string          "Неверный формат JSON или пользователь не найден"
// @Failure      500   {object}  string          "Внутренняя ошибка сервера"
// @Router       /users/login [post]
func (h *Handler) UserLogIn(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var input schemas.LoginByCode
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode("Неверный формат JSON тела запроса")
		return
	}

	user, err := h.userService.LoginByCode(r.Context(), input.Code)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(user)
}


// DeleteUser godoc
// @Summary      Удаление пользователя
// @Description  Удаляет пользователя из системы по его уникальному ID
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        id   query    string  true  "ID пользователя для удаления"
// @Success      204  {object}  string  "Пользователь успешно удален"
// @Failure      400  {object}  string  "ID не указан или пользователь не найден"
// @Failure      500  {object}  string  "Внутренняя ошибка сервера"
// @Router       /users [delete]
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Параметр id обязателен"})
		return
	}

	err := h.userService.DeleteUser(r.Context(), id)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}