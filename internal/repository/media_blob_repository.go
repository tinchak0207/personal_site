package repository

import (
	"errors"

	"github.com/dujiao-next/internal/models"
	"gorm.io/gorm"
)

type MediaBlobRepository interface {
	GetByPath(path string) (*models.MediaBlob, error)
	Upsert(blob *models.MediaBlob) error
	DeleteByPath(path string) error
}

type GormMediaBlobRepository struct {
	db *gorm.DB
}

func NewMediaBlobRepository(db *gorm.DB) *GormMediaBlobRepository {
	return &GormMediaBlobRepository{db: db}
}

func (r *GormMediaBlobRepository) GetByPath(path string) (*models.MediaBlob, error) {
	var blob models.MediaBlob
	if err := r.db.Where("path = ?", path).First(&blob).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &blob, nil
}

func (r *GormMediaBlobRepository) Upsert(blob *models.MediaBlob) error {
	return r.db.
		Where("path = ?", blob.Path).
		Assign(map[string]any{
			"mime_type": blob.MimeType,
			"data":      blob.Data,
		}).
		FirstOrCreate(blob).Error
}

func (r *GormMediaBlobRepository) DeleteByPath(path string) error {
	return r.db.Where("path = ?", path).Delete(&models.MediaBlob{}).Error
}
