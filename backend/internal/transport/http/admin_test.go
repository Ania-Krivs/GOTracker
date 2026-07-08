package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Ania-Krivs/GOTracker/internal/models"
	"github.com/Ania-Krivs/GOTracker/internal/schemas"
	"github.com/Ania-Krivs/GOTracker/internal/services"
)

type stubAdminService struct{}

func (s stubAdminService) CreateAdmin(ctx context.Context, input schemas.CreateAdminInput) (*models.Admin, bool, error) {
	return nil, false, nil
}

func (s stubAdminService) CheckSubscription(ctx context.Context, adminID string, userID string) bool {
	return true
}

func TestTriggerDuckReturnsOfflineErrorWhenUserIsNotConnected(t *testing.T) {
	handler := NewAdminHandler(stubAdminService{}, services.NewClientHub())

	payload := []byte(`{"admin_id":"admin-1","user_id":"user-1","message":"hello"}`)
	req := httptest.NewRequest(http.MethodPost, "/admin/message", bytes.NewReader(payload))
	rr := httptest.NewRecorder()

	handler.TriggerDuck(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d", http.StatusConflict, rr.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected JSON response, got %q: %v", rr.Body.String(), err)
	}

	if got := body["error"]; got != "Пользователь не в сети" {
		t.Fatalf("expected offline error message, got %q", got)
	}
}
