package models

import "time"

type Notification struct {
	ID        string    `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    string    `json:"user_id" gorm:"type:uuid;not null"`     // recipient
	ActorID   string    `json:"actor_id" gorm:"type:uuid;not null"`    // who caused the notification
	Type      string    `json:"type" gorm:"type:varchar(50);not null"` // e.g. "message", "connection_accepted", "like", "comment"
	EntityID  string    `json:"entity_id" gorm:"type:uuid"`            // related entity (post id, message id, convo id, connection id)
	Data      string    `json:"data" gorm:"type:text"`                 // optional JSON blob for extra metadata
	Read      bool      `json:"read" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
