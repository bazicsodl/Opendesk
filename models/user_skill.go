package models

import "github.com/google/uuid"

type UserSkill struct {
    ID     uint      `gorm:"primaryKey" json:"id"`
    UserID uuid.UUID `gorm:"type:uuid" json:"user_id"`
    Skill  string    `json:"skill"`
}
