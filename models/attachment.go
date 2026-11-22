// models/attachment.go
package models

type Attachment struct {
    ID        string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    MessageID string `gorm:"type:uuid;index"`
    URL       string `gorm:"type:text;not null"`
    FileName  string `gorm:"type:text"`
    MimeType  string `gorm:"type:text"`
    Size      int64
}