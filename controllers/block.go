package controllers

import (
	"net/http"
	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
)

// POST /block/:id
func BlockUser(c *gin.Context) {
	userID := c.GetString("user_id")
	blockedID := c.Param("id")

	if userID == blockedID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot block yourself"})
		return
	}
	if !userExists(blockedID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var existing models.Block
	if err := database.DB.Where("user_id = ? AND blocked_id = ?", userID, blockedID).First(&existing).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "blocked"})
		return
	}

	b := models.Block{UserID: userID, BlockedID: blockedID}
	if err := database.DB.Create(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to block"})
		return
	}

	// A block immediately prevents the relationship from remaining usable.
	database.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		userID, blockedID, blockedID, userID,
	).Delete(&models.Connection{})

	c.JSON(http.StatusOK, gin.H{"message": "blocked"})
}

// POST /unblock/:id
func UnblockUser(c *gin.Context) {
	userID := c.GetString("user_id")
	blockedID := c.Param("id")

	database.DB.Where("user_id = ? AND blocked_id = ?", userID, blockedID).Delete(&models.Block{})
	c.JSON(http.StatusOK, gin.H{"message": "unblocked"})
}

// GET /blocked
func GetBlocked(c *gin.Context) {
	userID := c.GetString("user_id")
	var blocks []models.Block
	database.DB.Where("user_id = ?", userID).Find(&blocks)
	c.JSON(http.StatusOK, blocks)
}
