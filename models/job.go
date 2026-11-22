package models

import (
	"time"
  
        "gorm.io/gorm"
        "github.com/google/uuid"
)

type Job struct {
	ID             string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    RecruiterID uuid.UUID     `gorm:"type:uuid" json:"recruiter_id"`
    Recruiter   Recruiter     `gorm:"foreignKey:RecruiterID" json:"recruiter"`
	Title          string     `json:"title"`
	Company        string     `json:"company"`
	Description    string     `json:"description"`
	Location       string     `json:"location"`
    Lat            float64    `json:"lat"` // ADD THIS
    Lng            float64    `json:"lng"` // ADD THIS
	EmploymentType string     `json:"employment_type"` // full-time, part-time, contract
	RemoteType     string     `json:"remote_type"`     // remote, hybrid, onsite
	SalaryMin      int        `json:"salary_min"`
	SalaryMax      int        `json:"salary_max"`
	CreatedBy      string     `gorm:"type:uuid" json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	BoostScore     float64    `gorm:"default:0" json:"boost_score"`
	Skills         []JobSkill `json:"skills" gorm:"foreignKey:JobID"`
}

func (j *Job) BeforeCreate(tx *gorm.DB) (err error) {
	j.CreatedAt = time.Now()
	return
}
