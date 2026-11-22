package models

import "time"

type Connection struct {
	ID         string    `json:"id" gorm:"type:uuid;default:gen_random_uuid();primary_key"`
	SenderID   string    `json:"sender_id" gorm:"type:uuid;not null"`   // user who sends request
	ReceiverID string    `json:"receiver_id" gorm:"type:uuid;not null"` // user who receives request
	Status     string    `json:"status" gorm:"default:'pending'"`       // pending, accepted, rejected
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
}
