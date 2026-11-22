package controllers

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"net/http"
	"opendesk/database"
	"opendesk/models"
	"opendesk/realtime"
)

// CreateNotification is a helper you can call from other controllers.
// data is optional metadata (map[string]interface{}) that will be marshalled to JSON.
func CreateNotification(recipientID, actorID, ntype, entityID string, data map[string]interface{}) error {
	var jsonStr string
	if data != nil {
		b, err := json.Marshal(data)
		if err == nil {
			jsonStr = string(b)
		}
	}

	n := models.Notification{
		UserID:   recipientID,
		ActorID:  actorID,
		Type:     ntype,
		EntityID: entityID,
		Data:     jsonStr,
	}

	// save to DB
	if err := database.DB.Create(&n).Error; err != nil {
		return err
	}

	// PUSH REAL-TIME
	payload := gin.H{
		"event": "notification",
		"data": gin.H{
			"id":         n.ID,
			"type":       n.Type,
			"actor_id":   n.ActorID,
			"entity_id":  n.EntityID,
			"data":       jsonStr,
			"created_at": n.CreatedAt,
		},
	}

	// If user is online, send instantly
	realtime.NotificationHub.Send(recipientID, payload)

	return nil
}

// List notifications for the current user (paginated simple)
func ListNotifications(c *gin.Context) {
	userID := c.GetString("user_id")

	var notifs []models.Notification
	// simple: most recent first, limit optional query param
	limit := 50
	if l := c.DefaultQuery("limit", "50"); l != "" {
		// ignore error handling for brevity; optionally parse
	}

	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Find(&notifs)
	c.JSON(http.StatusOK, notifs)
}

// Mark a single notification read
func MarkRead(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	var n models.Notification
	if err := database.DB.First(&n, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}

	n.Read = true
	database.DB.Save(&n)
	c.JSON(http.StatusOK, n)
}

// Mark all notifications as read for the current user
func MarkAllRead(c *gin.Context) {
	userID := c.GetString("user_id")

	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Updates(map[string]interface{}{"read": true})

	c.JSON(http.StatusOK, gin.H{"message": "all notifications marked read"})
}

// Delete a notification (recipient only)
func DeleteNotification(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// GetUnreadNotificationCount returns unread notifications count for current user.
func GetUnreadNotificationCount(c *gin.Context) {
	userID := c.GetString("user_id")

	var count int64
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = false", userID).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}
