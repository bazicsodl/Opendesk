package models

import "time"

type Comment struct {
    ID        string         `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    PostID    string         `json:"postId"`
    UserID    string         `json:"userId"`
    Content   string         `json:"content"`
    CreatedAt time.Time      `json:"createdAt"`
    User      User           `json:"user" gorm:"foreignKey:UserID"`
}

