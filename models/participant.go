// models/participant.go
package models

import "time"

type ConversationParticipant struct {
    ID             string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    ConversationID string    `gorm:"type:uuid;index;not null"`
    UserID         string    `gorm:"type:uuid;index;not null"`
    LastReadAt     *time.Time `gorm:"index;null"` // used for unread counters & seen timestamps
    CreatedAt      time.Time `gorm:"autoCreateTime"`
}