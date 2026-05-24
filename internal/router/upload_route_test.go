package router

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/dujiao-next/internal/models"
	"github.com/gin-gonic/gin"
)

type fakeUploadBlobSource struct {
	items map[string]*models.MediaBlob
}

func (f fakeUploadBlobSource) GetByPath(path string) (*models.MediaBlob, error) {
	if f.items == nil {
		return nil, nil
	}
	return f.items[path], nil
}

func TestRegisterUploadsRoute_ServesLocalFileFirst(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	root := t.TempDir()
	targetDir := filepath.Join(root, "banner", "2026", "05")
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	targetPath := filepath.Join(targetDir, "local.png")
	expected := []byte("local-png-data")
	if err := os.WriteFile(targetPath, expected, 0o644); err != nil {
		t.Fatalf("write file: %v", err)
	}

	registerUploadsRoute(r, root, fakeUploadBlobSource{
		items: map[string]*models.MediaBlob{
			"/uploads/banner/2026/05/local.png": {
				Path:     "/uploads/banner/2026/05/local.png",
				MimeType: "image/png",
				Data:     []byte("blob-data"),
			},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/uploads/banner/2026/05/local.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if got := w.Body.Bytes(); string(got) != string(expected) {
		t.Fatalf("body = %q, want %q", got, expected)
	}
}

func TestRegisterUploadsRoute_FallsBackToBlobAndRehydratesDisk(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	root := t.TempDir()
	expected := []byte("blob-png-data")
	registerUploadsRoute(r, root, fakeUploadBlobSource{
		items: map[string]*models.MediaBlob{
			"/uploads/banner/2026/05/fallback.png": {
				Path:     "/uploads/banner/2026/05/fallback.png",
				MimeType: "image/png",
				Data:     expected,
			},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/uploads/banner/2026/05/fallback.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if got := w.Header().Get("Content-Type"); got != "image/png" {
		t.Fatalf("content-type = %q, want image/png", got)
	}
	if got := w.Body.Bytes(); string(got) != string(expected) {
		t.Fatalf("body = %q, want %q", got, expected)
	}

	rehydrated := filepath.Join(root, "banner", "2026", "05", "fallback.png")
	got, err := os.ReadFile(rehydrated)
	if err != nil {
		t.Fatalf("rehydrated file missing: %v", err)
	}
	if string(got) != string(expected) {
		t.Fatalf("rehydrated body = %q, want %q", got, expected)
	}
}

func TestRegisterUploadsRoute_Returns404WhenMissing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	registerUploadsRoute(r, t.TempDir(), fakeUploadBlobSource{})

	req := httptest.NewRequest(http.MethodGet, "/uploads/banner/2026/05/missing.png", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}
}
