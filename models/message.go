// models/message.go
package models

import "time"

type Message struct {
    ID             string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    ConversationID string    `gorm:"type:uuid;not null;index"`
    SenderID       string    `gorm:"type:uuid;not null;index"`
    Content        string    `gorm:"type:text"`
    Attachments    []Attachment `gorm:"foreignKey:MessageID"`
    EditedAt       *time.Time `gorm:"index;null"`
    DeletedAt      *time.Time `gorm:"index;null"`
    CreatedAt      time.Time  `gorm:"autoCreateTime"`
}
