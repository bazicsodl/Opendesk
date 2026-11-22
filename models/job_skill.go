package models

import "github.com/google/uuid"

type JobSkill struct {
    ID    uint      `gorm:"primaryKey" json:"id"`
    JobID uuid.UUID `gorm:"type:uuid" json:"job_id"`
    Skill string    `json:"skill"`
}
