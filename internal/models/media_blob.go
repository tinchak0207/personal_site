package models

import "time"

// MediaBlob 持久化保存上传素材的原始二进制，避免容器重建后 uploads 丢失。
type MediaBlob struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Path      string    `gorm:"type:varchar(500);not null;uniqueIndex" json:"path"`
	MimeType  string    `gorm:"type:varchar(100);not null" json:"mime_type"`
	Data      []byte    `gorm:"not null" json:"-"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MediaBlob) TableName() string {
	return "media_blobs"
}
