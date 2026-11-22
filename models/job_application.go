// models/job_application.go

package models

import (
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type JobApplication struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
    JobID       uuid.UUID `gorm:"type:uuid" json:"job_id"`
    ApplicantID uuid.UUID `gorm:"type:uuid" json:"applicant_id"`
    ResumeURL   string    `json:"resume_url"`
    CoverLetter string    `json:"cover_letter"`
    Status      string    `gorm:"default:'pending'" json:"status"`
    ReviewedAt  *time.Time `json:"reviewed_at"`
    CreatedAt   time.Time `json:"created_at"`
}

func (a *JobApplication) BeforeCreate(tx *gorm.DB) (err error) {
    a.ID = uuid.New()
    a.CreatedAt = time.Now()
    a.Status = "pending"
    return
}
