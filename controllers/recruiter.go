package controllers

import (
	"net/http"
	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getRecruiterByUserID(userID string) (*models.Recruiter, error) {
	var rec models.Recruiter
	if err := database.DB.Where("user_id = ?", userID).First(&rec).Error; err != nil {
		return nil, err
	}
	return &rec, nil
}

func CreateRecruiterProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var body struct {
		CompanyName string `json:"company_name"`
		Industry    string `json:"industry"`
		Location    string `json:"location"`
		Website     string `json:"website"`
		Logo        string `json:"logo"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// prevent double creation
	var existing models.Recruiter
	if err := database.DB.Where("user_id = ?", userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "recruiter profile already exists"})
		return
	}

	rec := models.Recruiter{
		UserID:      userUUID,
		CompanyName: body.CompanyName,
		Industry:    body.Industry,
		Location:    body.Location,
		Website:     body.Website,
		Logo:        body.Logo,
	}

	if err := database.DB.Create(&rec).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = database.DB.Model(&models.User{}).
		Where("id = ?", userID).
		Update("role", "recruiter").Error

	c.JSON(200, rec)
}

func GetMyRecruiterProfile(c *gin.Context) {
	userID := c.GetString("user_id")

	var rec models.Recruiter
	if err := database.DB.Where("user_id = ?", userID).First(&rec).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "recruiter profile not found"})
		return
	}

	c.JSON(200, rec)
}
