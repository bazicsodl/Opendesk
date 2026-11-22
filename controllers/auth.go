package controllers

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"opendesk/database"
	"opendesk/models"
	"opendesk/utils"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

func publicFrontendURL() string {
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		return v
	}
	if v := os.Getenv("APP_URL"); v != "" {
		return v
	}
	return "http://localhost:3000"
}

func Register(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email,max=254"`
		Password string `json:"password" binding:"required,min=8,max=72"`
		Name     string `json:"name" binding:"required,min=1,max=120"`
		Role     string `json:"role"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valid email, name, and an 8-72 character password are required"})
		return
	}
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))
	body.Name = strings.TrimSpace(body.Name)

	// Hash password
	hash, err := utils.HashPassword(body.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create verify token immediately
	verifyToken, err := utils.GenerateRandomToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	role := "user"
	if body.Role == "recruiter" {
		role = "recruiter"
	}

	user := models.User{
		Email:           body.Email,
		Password:        hash,
		DisplayName:     body.Name,
		Role:            role,
		Verified:        false,
		VerifyToken:     verifyToken,
		VerifyExpiresAt: time.Now().Add(24 * time.Hour),
	}

	result := database.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	// Build verification URL
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s",
		publicFrontendURL(),
		verifyToken,
	)

	// Try sending email only if SMTP is available
	html := utils.EmailVerificationHTML(user.Email, verifyURL)

	err = utils.SendEmail(user.Email, user.DisplayName, "Verify your Opendesk account", html)
	if err != nil {
		fmt.Println("EMAIL ERROR:", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User registered. Please verify your email.",
		"role":    role,
	})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// LoginRateLimit middleware reads the request body with ShouldBindBodyWith.
	// Use the same binder here so we bind from Gin's cached copy instead of a drained body.
	if err := c.ShouldBindBodyWith(&body, binding.JSON); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user models.User
	database.DB.Where("email = ?", body.Email).First(&user)

	if user.ID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !utils.CheckPassword(body.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	if !user.Verified {
		c.JSON(403, gin.H{"error": "Email not verified"})
		return
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// ⭐ FIX — get the user's IP from the request
	requestIP := c.ClientIP()

	// Extract device info
	userAgent := c.Request.UserAgent()
	deviceInfo := utils.ParseUserAgent(userAgent)

	alertURL := fmt.Sprintf("%s/auth/reset-password/%s", publicFrontendURL(), token)

	html := utils.LoginSecurityAlert(user.DisplayName, requestIP, alertURL, deviceInfo)

	// Send email
	// Send email
	err = utils.SendEmail(user.Email, user.DisplayName, "Login notification", html)
	if err != nil {
		fmt.Println("EMAIL ERROR:", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":          user.ID,
			"email":       user.Email,
			"displayName": user.DisplayName,
			"role":        user.Role,
			"verified":    user.Verified,
		},
	})
}

func SendVerification(c *gin.Context) {
	userID := c.GetString("user_id")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	token, err := utils.GenerateRandomToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	database.DB.Model(&user).Updates(map[string]interface{}{
		"verify_token":      token,
		"verify_expires_at": time.Now().Add(24 * time.Hour),
		"verified":          false,
	})

	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", publicFrontendURL(), token)
	html := utils.EmailVerificationHTML(user.Email, verifyURL)

	// Send email (ignore failures during development)
	err = utils.SendEmail(user.Email, user.DisplayName, "Verify your Opendesk account", html)
	if err != nil {
		fmt.Println("EMAIL ERROR:", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification email sent"})
}

func VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired token"})
		return
	}

	var user models.User
	if err := database.DB.Where("verify_token = ? AND verify_expires_at > ?", token, time.Now()).First(&user).Error; err != nil {
		c.JSON(400, gin.H{"error": "Invalid or expired token"})
		return
	}

	database.DB.Model(&user).Updates(map[string]interface{}{
		"verified":          true,
		"verify_token":      "",
		"verify_expires_at": time.Time{},
	})

	c.JSON(200, gin.H{"message": "Email verified successfully"})
}
