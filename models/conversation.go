// models/conversation.go
package models

import "time"

type Conversation struct {
    ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    User1ID   string    `gorm:"type:uuid;not null;index"`
    User2ID   string    `gorm:"type:uuid;not null;index"`
    CreatedAt time.Time `gorm:"autoCreateTime"`
}