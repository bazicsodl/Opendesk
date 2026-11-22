package models

import "time"

type Post struct {
    ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
    UserID    string    `gorm:"type:uuid;not null" json:"user_id"`
    Content   string    `gorm:"type:text" json:"content"`
    ImageURL  string    `json:"image_url"` // backward-compatible media URL
    MediaType string    `gorm:"default:'image'" json:"media_type"`
    MediaName string    `json:"media_name"`
    Likes     int       `gorm:"default:0" json:"likes"` // number of likes
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

    // --- Relations ---
    User     User       `gorm:"foreignKey:UserID" json:"-"`
    Comments []Comment  `gorm:"foreignKey:PostID" json:"-"`
}
