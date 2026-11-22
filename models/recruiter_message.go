package models

import (
	"time"
 
        "gorm.io/gorm"
	"github.com/google/uuid"
)

type RecruiterMessage struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	JobID      string    `gorm:"type:uuid;index" json:"job_id"`
	FromUserID string    `gorm:"type:uuid;index" json:"from_user_id"` // recruiter or system
	ToUserID   string    `gorm:"type:uuid;index" json:"to_user_id"`   // applicant
	Text       string    `json:"text"`
	CreatedAt  time.Time `json:"created_at"`
}

func (r *RecruiterMessage) BeforeCreate(tx *gorm.DB) (err error) {
	r.ID = uuid.NewString()
	r.CreatedAt = time.Now()
	return
}
