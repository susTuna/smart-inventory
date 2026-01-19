package http

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/susTuna/smart-inventory/backend-local/pkg/response"
)

var (
	signKey		ed25519.PrivateKey
	verifyKey	ed25519.PublicKey
)

func init() {
	var err error
	verifyKey, signKey, err = ed25519.GenerateKey(rand.Reader)
	if err != nil {
		log.Fatal("Critical Error: Failed to generate Ed25519 keys for session security")
	}
}
type Claims struct {
	UserID string 	`json:"user_id"`
	Role string		`json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, role string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Role: 	role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: 	jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt: 	jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	return token.SignedString(signKey)
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Error(w, http.StatusUnauthorized, "Missing Authorization header")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(w, http.StatusUnauthorized, "Invalid token format")
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
				return nil, jwt.ErrSignatureInvalid
			}

			return verifyKey, nil
		})

		if err != nil || !token.Valid {
			response.Error(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), "userID", claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}