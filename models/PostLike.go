package models

import "time"

type PostLike struct {
    ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    PostID    string    `gorm:"type:uuid;not null"`
    UserID    string    `gorm:"type:uuid;not null"`
    CreatedAt time.Time `gorm:"autoCreateTime"`

    Post Post `gorm:"foreignKey:PostID"`
    User User `gorm:"foreignKey:UserID"`
}
