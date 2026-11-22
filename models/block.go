package models

import "time"

type Block struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;not null;uniqueIndex:idx_blocks_user_blocked;index" json:"user_id"`    // who blocked
	BlockedID string    `gorm:"type:uuid;not null;uniqueIndex:idx_blocks_user_blocked;index" json:"blocked_id"` // who was blocked
	CreatedAt time.Time `json:"created_at"`
}
