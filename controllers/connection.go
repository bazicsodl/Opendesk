package controllers

import (
	"net/http"
	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
)

// POST /connections/:id (receiverID)
func SendConnectionRequest(c *gin.Context) {
	senderID := c.GetString("user_id")
	if senderID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	receiverID := c.Param("id")
	if receiverID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "receiver id required"})
		return
	}

	// Prevent duplicates
	var existing models.Connection
	if err := database.DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		senderID, receiverID, receiverID, senderID,
	).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Connection already exists"})
		return
	}

	conn := models.Connection{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Status:     "pending",
	}

	if err := database.DB.Create(&conn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create connection"})
		return
	}
	if receiverID == senderID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot connect with yourself"})
		return
	}
	if !userExists(receiverID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if isInteractionBlocked(senderID, receiverID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	if senderID != receiverID {
		go CreateNotification(receiverID, senderID, "connection_request", conn.ID, map[string]interface{}{
			"text": "You have a new connection request",
		})
	}

	c.JSON(http.StatusOK, conn)
}

// POST /connections/:id/accept
func AcceptConnection(c *gin.Context) {
	receiverID := c.GetString("user_id")
	connectionID := c.Param("id")

	var conn models.Connection
	if err := database.DB.First(&conn, "id = ?", connectionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection request not found"})
		return
	}

	if conn.ReceiverID != receiverID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not allowed"})
		return
	}
	if isInteractionBlocked(conn.SenderID, receiverID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	conn.Status = "accepted"
	database.DB.Save(&conn)

	// ✨ Ensure you have CreateNotification imported
	go CreateNotification(conn.SenderID, receiverID, "connection_accepted", conn.ID, map[string]interface{}{
		"text": "Your connection request was accepted",
	})

	c.JSON(http.StatusOK, gin.H{"message": "Connection accepted"})
}

// POST /connections/:id/reject
func RejectConnection(c *gin.Context) {
	receiverID := c.GetString("user_id")
	connectionID := c.Param("id")

	var conn models.Connection
	if err := database.DB.First(&conn, "id = ?", connectionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connection request not found"})
		return
	}

	if conn.ReceiverID != receiverID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not allowed"})
		return
	}

	conn.Status = "rejected"
	database.DB.Save(&conn)

	c.JSON(http.StatusOK, gin.H{"message": "Connection rejected"})
}

// GET /users/:id/connections
func GetUserConnections(c *gin.Context) {
	userID := c.Param("id")
	if isInteractionBlocked(c.GetString("user_id"), userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var connections []models.Connection
	database.DB.Where(
		"(sender_id = ? OR receiver_id = ?) AND status = 'accepted'",
		userID, userID,
	).Find(&connections)

	c.JSON(http.StatusOK, connections)
}

// GET /connections/pending
func GetPendingRequests(c *gin.Context) {
	userID := c.GetString("user_id")

	var requests []models.Connection
	database.DB.Where("receiver_id = ? AND status = 'pending'", userID).
		Find(&requests)

	c.JSON(http.StatusOK, requests)
}

// GET /connections/me
func GetMyConnections(c *gin.Context) {
	userID := c.GetString("user_id")

	var connections []models.Connection
	database.DB.Where(
		"(sender_id = ? OR receiver_id = ?) AND status = 'accepted'",
		userID, userID,
	).Find(&connections)

	c.JSON(http.StatusOK, connections)
}
