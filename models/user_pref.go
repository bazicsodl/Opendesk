package models

import (
    "gorm.io/gorm"
)

type UserPreference struct {
    gorm.Model

    UserID string `json:"user_id" gorm:"uniqueIndex"`

    JobTitles      []string `gorm:"type:text[]" json:"job_titles"`
    PreferredTypes []string `gorm:"type:text[]" json:"preferred_types"`
    WorkModes      []string `gorm:"type:text[]" json:"work_modes"`

    // Single location object (label, lat, lng)
    Location       []byte `gorm:"type:jsonb" json:"location"`

    SalaryMin    int  `json:"salary_min"`
    RadiusKm     int  `json:"radius_km"`
    AlertEnabled bool `json:"alert_enabled"`
}
