package models

import (
	"github.com/lib/pq"
	"time"
)

type Profile struct {
	ID               string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID           string `gorm:"type:uuid;not null;uniqueIndex"`
	Headline         string
	Bio              string
	Location         string
	School           string
	Degree           string
	Company          string
	Website          string
	CurrentRole      string
	Experience       string
	EducationDetails string
	FeaturedLinks    pq.StringArray `gorm:"type:text[]" json:"featured_links"`
	Skills           pq.StringArray `gorm:"type:text[]" json:"skills"`
	ImageURL         string
	CoverImageURL    string
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}
