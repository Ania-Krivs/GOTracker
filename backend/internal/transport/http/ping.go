package http

import "net/http"

func PingRouter(){
	http.HandleFunc("/ping", Ping)
}

// Ping godoc
// @Summary      Проверка работоспособности (Healthcheck)
// @Description  Возвращает текстовый ответ "pong", если сервис успешно запущен и принимает запросы
// @Tags         system
// @Produce      plain
// @Success      200  {string}  string "pong"
// @Failure      405  {string}  string "Method Not Allowed"
// @Router       /ping [get]
func Ping(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "text/plain")
    w.WriteHeader(http.StatusOK)

	_, _ = w.Write([]byte("pong"))

}