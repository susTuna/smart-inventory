package http

import (
	"encoding/json"
	"net/http"

	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
	"github.com/susTuna/smart-inventory/backend-local/pkg/response"
)

type AuthHandler struct {
	svc ports.UserService
}

func NewAuthHandler(svc ports.UserService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

type loginRequest struct {
	Username string	`json:"username"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token 	 string `json:"token"`
	Username string	`json:"username"`
	Role	 string `json:"role"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.svc.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := GenerateToken(user.ID, string(user.Role))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	response.Success(w, loginResponse{
		Token: token,
		Username: user.Username,
		Role: string(user.Role),
	})
}