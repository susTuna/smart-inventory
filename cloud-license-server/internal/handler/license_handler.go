package handler

import (
	"crypto/ed25519"
	"crypto/x509"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	cloudSignKey   ed25519.PrivateKey
)

func init() {
	keyStr := os.Getenv("LICENSE_PRIVATE_KEY")
	if keyStr != "" {
		keyBytes, err := base64.StdEncoding.DecodeString(keyStr)
		if err != nil {
			log.Fatalf("Failed to decode LICENSE_PRIVATE_KEY from env: %v", err)
		}
		if len(keyBytes) == ed25519.PrivateKeySize {
			cloudSignKey = ed25519.PrivateKey(keyBytes)
			return
		}
		key, err := x509.ParsePKCS8PrivateKey(keyBytes)
		if err != nil {
			log.Fatalf("Invalid Ed25519 private key in env. Length is %d (expected 64 for raw). PKCS8 parse failed: %v", len(keyBytes), err)
		}
		
		var ok bool
		cloudSignKey, ok = key.(ed25519.PrivateKey)
		if !ok {
			log.Fatalf("Environment key is not an Ed25519 private key")
		}
		return
	}
}

type LicenseHandler struct {
	db *sql.DB
}

func NewLicenseHandler(db *sql.DB) *LicenseHandler {
	return &LicenseHandler{db: db}
}

type heartbeatReq struct {
	LicenseKey string `json:"license_key"`
	HardwareID string `json:"hardware_id"`
}

type heartbeatRes struct {
	Valid 		bool 	`json:"valid"`
	OfflineToken string `json:"offline_token,omitempty"`
	Message 	string `json:"message,omitempty"`
}

func (h *LicenseHandler) Heartbeat(w http.ResponseWriter, r *http.Request) {
	var req heartbeatReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Body", http.StatusBadRequest)
		return
	}

	valid, plan, err := h.verifyLicenseInDB(req.LicenseKey, req.HardwareID)
	if err != nil {
		log.Printf("License check error: %v", err)
		jsonResponse(w, http.StatusInternalServerError, heartbeatRes{
			Valid: false,
			Message: "Internal Server Error",
		})
		return
	}

	if !valid {
		jsonResponse(w, http.StatusPaymentRequired, heartbeatRes{
			Valid: false,
			Message: "Invalid, Expired, or Hardware Mismatch",
		})
		return
	}

	token, err := generateOfflineToken(req.LicenseKey, plan)
	if err != nil {
		log.Printf("Token generation error: %v", err)
		http.Error(w, "Signing Error", http.StatusInternalServerError)
		return
	}

	jsonResponse(w, http.StatusOK, heartbeatRes{
		Valid: true,
		OfflineToken: token,
		Message: "Subscription Active",
	})
}

func (h *LicenseHandler) verifyLicenseInDB(key, hwID string) (bool, string, error) {
	var dbHwID sql.NullString
	var expiry time.Time
	var status string
	var plan string

	query := `
		SELECT hardware_id, expiry_date, status, plan_type
		FROM licenses
		WHERE key = $1
	`

	err := h.db.QueryRow(query, key).Scan(&dbHwID, &expiry, &status, &plan)

	if err == sql.ErrNoRows {
		return false, "", nil
	}
	if err != nil {
		return false, "", err
	}

	if status != "ACTIVE" {
		return false, "", nil
	}

	if time.Now().After(expiry) {
		return false, "", nil
	}

	if !dbHwID.Valid || dbHwID.String == "" {
		_, err := h.db.Exec("UPDATE licenses SET hardware_id = $1 WHERE key = $2", hwID, key)
		if err != nil {
			return false, "", fmt.Errorf("failed to lock hardware id: %w", err)
		}
		return true, plan, nil
	}
	
	if dbHwID.String != hwID {
		return false, "", nil
	}

	return true, plan, nil
}

func generateOfflineToken(licenseKey, plan string) (string, error) {
	claims := jwt.MapClaims{
		"sub": licenseKey,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"plan": plan,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodEdDSA, claims)
	return token.SignedString(cloudSignKey)
}

func jsonResponse(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}