package controllers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"opendesk/database"
	"opendesk/models"
	"opendesk/utils"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func genToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func frontendURL() string {
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		return v
	}
	if v := os.Getenv("APP_URL"); v != "" {
		return v
	}
	return "http://localhost:3000"
}

func sendResetEmail(toEmail, token string) error {
	resetLink := fmt.Sprintf("%s/auth/reset-password/%s", frontendURL(), token)
	html := utils.PasswordResetHTML(toEmail, resetLink)
	return utils.SendEmail(toEmail, toEmail, "OpenDesk password reset", html)
}

func resetTokenDigest(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// POST /auth/forgot-password
func ForgotPassword(c *gin.Context) {
	var body struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	token, err := genToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
		return
	}

	pr := models.PasswordReset{
		Email:     body.Email,
		Token:     resetTokenDigest(token),
		ExpiresAt: time.Now().Add(1 * time.Hour),
	}
	if err := database.DB.Create(&pr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save token"})
		return
	}

	if err := sendResetEmail(body.Email, token); err != nil {
		fmt.Println("SMTP warning (forgot password):", err)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// POST /auth/reset-password/:token
func ResetPassword(c *gin.Context) {
	token := c.Param("token")
	var body struct {
		Password string `json:"password" binding:"required,min=8,max=72"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid password (8-72 characters required)"})
		return
	}

	var pr models.PasswordReset
	if err := database.DB.Where("token = ?", resetTokenDigest(token)).First(&pr).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	if time.Now().After(pr.ExpiresAt) {
		database.DB.Delete(&pr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "token expired"})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", pr.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	hashed, err := utils.HashPassword(body.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user.Password = hashed
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	database.DB.Where("email = ?", pr.Email).Delete(&models.PasswordReset{})
	c.JSON(http.StatusOK, gin.H{"message": "password reset successful"})
}
