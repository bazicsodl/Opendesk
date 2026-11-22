package models

import "time"

type User struct {
	ID              string `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email           string `gorm:"uniqueIndex;not null"`
	Password        string `gorm:"not null"`
	DisplayName     string
	Role            string `gorm:"default:user"`
	Verified        bool
	VerifyToken     string
	VerifyExpiresAt time.Time
	ResetToken      string `gorm:"size:255"`
	ResetExpiresAt  time.Time
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	LastSeen        time.Time
}
