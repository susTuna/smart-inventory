package entity

import "time"

type MovementType string

const (
	MovementInbound    MovementType = "INBOUND"    // Restock / Purchase
	MovementOutbound   MovementType = "OUTBOUND"   // Sales
	MovementAdjustment MovementType = "ADJUSTMENT" // Stock Opname / Correction
	MovementReturn     MovementType = "RETURN"     // Customer Return
)

type StockMovement struct {
	ID           int64        `json:"id"`
	SkuID        string       `json:"sku_id"`
	UserID       *string      `json:"user_id,omitempty"` // Pointer to allow NULL
	ChangeAmount int          `json:"change_amount"`
	Type         MovementType `json:"type"`
	ReferenceID  string       `json:"reference_id,omitempty"` // Order ID or Receipt
	Note         string       `json:"note,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
}