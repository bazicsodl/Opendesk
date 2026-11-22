package utils

import (
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

const MaxUploadSize int64 = 10 << 20 // 10 MiB

// ValidateUpload restricts public uploads to the currently supported profile,
// portfolio, resume, and message attachment types. SVG and executable content
// are intentionally excluded because uploads are served from a public path.
func ValidateUpload(file multipart.File, header *multipart.FileHeader) error {
	if header == nil || header.Size <= 0 || header.Size > MaxUploadSize {
		return errors.New("file must be between 1 byte and 10 MiB")
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExtensions := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
		".gif": true, ".pdf": true, ".doc": true, ".docx": true,
	}
	if !allowedExtensions[ext] {
		return errors.New("unsupported file type")
	}

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return errors.New("could not inspect uploaded file")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return errors.New("could not process uploaded file")
	}

	detected := http.DetectContentType(buffer[:n])
	allowedTypes := map[string]bool{
		"image/jpeg": true, "image/png": true, "image/webp": true,
		"image/gif": true, "application/pdf": true,
		"application/msword": true, "application/vnd.ms-office": true,
		"application/zip": true, // DOCX files are ZIP containers.
	}
	if !allowedTypes[detected] {
		return errors.New("file contents do not match a supported format")
	}
	if ext == ".docx" && detected != "application/zip" {
		return errors.New("file contents do not match a DOCX document")
	}
	if (ext == ".jpg" || ext == ".jpeg") && detected != "image/jpeg" {
		return errors.New("file contents do not match a JPEG image")
	}
	if (ext == ".png" && detected != "image/png") ||
		(ext == ".webp" && detected != "image/webp") ||
		(ext == ".gif" && detected != "image/gif") ||
		(ext == ".pdf" && detected != "application/pdf") {
		return errors.New("file contents do not match its extension")
	}

	return nil
}
