package models

import (
    "time"
    "github.com/google/uuid"
)

type JobAlert struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    UserID    string    `gorm:"type:uuid;index" json:"user_id"`
    JobID     uuid.UUID `gorm:"type:uuid" json:"job_id"`
    SentAt    time.Time `json:"sent_at"`
}
