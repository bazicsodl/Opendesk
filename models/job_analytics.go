package models

import (
	"time"
)

type JobMetric struct {
	JobID       string    `gorm:"type:uuid;primaryKey" json:"job_id"`
	Views       int64     `json:"views"`
	Clicks      int64     `json:"clicks"`   // clicks = visits to job details
	Applications int64    `json:"applications"`
	LastUpdated time.Time `json:"last_updated"`
}

// Optional detailed event logging (keeps raw events for deeper analytics)
type JobEvent struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	JobID     string    `gorm:"type:uuid;index" json:"job_id"`
	UserID    string    `gorm:"type:uuid;index;null" json:"user_id"` // may be empty for anonymous
	EventType string    `json:"event_type"`                          // "view", "click", "apply"
	Meta      string    `json:"meta"`                                // optional JSON blob
	CreatedAt time.Time `json:"created_at"`
}
