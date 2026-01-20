package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/susTuna/smart-inventory/backend-local/internal/core/ports"
	"github.com/susTuna/smart-inventory/backend-local/pkg/response"
)

type ProductHandler struct {
	svc ports.ProductService
}

func NewProductHandler(svc ports.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

type createProductReq struct {
	SKU   string `json:"sku"`
	Name  string `json:"name"`
	Price int64  `json:"price"`
}

type stockOpReq struct {
	Qty  int    `json:"qty"`
	Note string `json:"note"`
}

type scanReq struct {
	Barcode string `json:"barcode"`
}

func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	size, _ := strconv.Atoi(r.URL.Query().Get("size"))
	if size == 0 {
		size = 20
	}

	products, err := h.svc.ListProducts(r.Context(), page, size)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.Success(w, products)
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createProductReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := h.svc.CreateProduct(r.Context(), req.SKU, req.Name, req.Price); err != nil {
		response.Error(w, http.StatusConflict, err.Error())
		return
	}
	response.Success(w, "Product Created")
}

func (h *ProductHandler) Scan(w http.ResponseWriter, r *http.Request) {
	var req scanReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	product, err := h.svc.GetProductByBarcode(r.Context(), req.Barcode)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if product != nil {
		response.Error(w, http.StatusNotFound, "Product not found")
		return
	}

	response.Success(w, product)
}

func (h *ProductHandler) Restock(w http.ResponseWriter, r *http.Request) {
	sku := chi.URLParam(r, "sku")
	userID :=  r.Context().Value("userID").(string)

	var req stockOpReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := h.svc.Restock(r.Context(), sku, req.Qty, req.Note, &userID); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.Success(w, "Stock added")
}

func (h *ProductHandler) Deduct(w http.ResponseWriter, r *http.Request) {
	sku := chi.URLParam(r, "sku")
	userID :=  r.Context().Value("userID").(string)

	var req stockOpReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if err := h.svc.DeductStock(r.Context(), sku, req.Qty, req.Note, &userID); err != nil {
		response.Error(w, http.StatusConflict, err.Error())
		return
	}
	response.Success(w, "Stock deducted")
}