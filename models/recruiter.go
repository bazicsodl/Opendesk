package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Recruiter struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"user_id"` // owner user
	CompanyName string    `json:"company_name"`
	Industry    string    `json:"industry"`
	Location    string    `json:"location"`
	Website     string    `json:"website"`
	Logo        string    `json:"logo"`
	Verified    bool      `gorm:"default:false" json:"verified"`

	CreatedAt time.Time `json:"created_at"`
}

func (r *Recruiter) BeforeCreate(tx *gorm.DB) (err error) {
	r.ID = uuid.New()
	r.CreatedAt = time.Now()
	return
}
