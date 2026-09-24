package integration

import (
    "bytes"
    "context"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    httpHandler "github.com/susTuna/smart-inventory/backend-local/internal/adapter/handler/http"
    "github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite"
    "github.com/susTuna/smart-inventory/backend-local/internal/adapter/storage/sqlite/repo"
    "github.com/susTuna/smart-inventory/backend-local/internal/core/entity"
    "github.com/susTuna/smart-inventory/backend-local/internal/core/service"
)

// Helper to make requests
func executeRequest(r http.Handler, method, path string, body interface{}, token string) *httptest.ResponseRecorder {
    var bodyReader *bytes.Buffer
    if body != nil {
        jsonBytes, _ := json.Marshal(body)
        bodyReader = bytes.NewBuffer(jsonBytes)
    } else {
        bodyReader = bytes.NewBuffer(nil)
    }

    req, _ := http.NewRequest(method, path, bodyReader)
    if token != "" {
        req.Header.Set("Authorization", "Bearer "+token)
    }
    
    rr := httptest.NewRecorder()
    (r).ServeHTTP(rr, req)
    return rr
}

func TestFullAPIFlow(t *testing.T) {
    // 1. Setup InMemory DB & App
    db, err := sqlite.NewConnection(":memory:")
    if err != nil {
        t.Fatalf("Failed to create database: %v", err)
    }
    defer db.Close()

    userRepo := repo.NewUserRepo(db)
    prodRepo := repo.NewProductRepo(db)
    userSvc := service.NewUserService(userRepo)
    prodSvc := service.NewProductService(prodRepo)

    // Create User
    err = userSvc.Register(context.Background(), "tester", "pass", entity.RoleAdmin)
    if err != nil {
        t.Fatalf("Failed to register user: %v", err)
    }

    // Setup Router
    router := httpHandler.NewRouter(userSvc, prodSvc)

    // --- STEP A: LOGIN ---
    loginPayload := map[string]string{"username": "tester", "password": "pass"}
    resp := executeRequest(router, "POST", "/api/v1/login", loginPayload, "")
    
    if resp.Code != 200 {
        t.Fatalf("Login failed: %v", resp.Body.String())
    }
    
    var loginRes map[string]interface{}
    json.Unmarshal(resp.Body.Bytes(), &loginRes)
    data := loginRes["data"].(map[string]interface{})
    token := data["token"].(string)

    // --- STEP B: CREATE PRODUCT ---
    prodPayload := map[string]interface{}{"sku": "ITEM-1", "name": "Test Item", "price": 1000}
    resp = executeRequest(router, "POST", "/api/v1/products", prodPayload, token)
    if resp.Code != 200 {
        t.Fatalf("Create Product failed: %v", resp.Body.String())
    }

    // --- STEP C: RESTOCK (+10) ---
    stockPayload := map[string]interface{}{"qty": 10, "note": "Initial"}
    resp = executeRequest(router, "POST", "/api/v1/products/ITEM-1/restock", stockPayload, token)
    if resp.Code != 200 {
        t.Fatalf("Restock failed: %v", resp.Body.String())
    }

    // --- STEP D: DEDUCT (-15) [SHOULD FAIL] ---
    deductPayload := map[string]interface{}{"qty": 15, "note": "Over sell"}
    resp = executeRequest(router, "POST", "/api/v1/products/ITEM-1/deduct", deductPayload, token)
    if resp.Code != 409 { // Expecting Conflict due to DB Constraint
        t.Fatalf("Expected 409 Conflict for overselling, got %d. Body: %v", resp.Code, resp.Body.String())
    }

    // --- STEP E: DEDUCT (-5) [SHOULD PASS] ---
    deductPayload["qty"] = 5
    resp = executeRequest(router, "POST", "/api/v1/products/ITEM-1/deduct", deductPayload, token)
    if resp.Code != 200 {
        t.Fatalf("Valid deduction failed: %v", resp.Body.String())
    }
}