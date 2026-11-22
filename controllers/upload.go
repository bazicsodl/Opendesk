package controllers

import (
	"net/http"
	"opendesk/utils"

	"github.com/gin-gonic/gin"
)

func UploadImage(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, utils.MaxUploadSize)
	file, fileHeader, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file found"})
		return
	}
	defer file.Close()
	if err := utils.ValidateUpload(file, fileHeader); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	url, err := utils.UploadToCloudinary(file, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Upload failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":      url,
		"mime":     fileHeader.Header.Get("Content-Type"),
		"filename": fileHeader.Filename,
		"size":     fileHeader.Size,
	})
}
