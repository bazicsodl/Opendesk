package controllers

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"opendesk/database"
	"opendesk/models"
	"opendesk/realtime"
	"opendesk/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getOrCreateConversation(user1, user2 string) models.Conversation {
	var convo models.Conversation
	database.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		user1, user2, user2, user1,
	).First(&convo)

	if convo.ID != "" {
		return convo
	}

	convo = models.Conversation{
		User1ID: user1,
		User2ID: user2,
	}
	database.DB.Create(&convo)
	return convo
}

// helper: getOrCreateConversation (unchanged) - ensure participant records exist
func ensureParticipants(convoID string, a, b string) {
	// upsert ConversationParticipant rows
	now := time.Now().UTC()
	db := database.DB
	// upsert a
	var p models.ConversationParticipant
	if err := db.Where("conversation_id = ? AND user_id = ?", convoID, a).First(&p).Error; err != nil {
		db.Create(&models.ConversationParticipant{ConversationID: convoID, UserID: a, CreatedAt: now})
	}
	if err := db.Where("conversation_id = ? AND user_id = ?", convoID, b).First(&p).Error; err != nil {
		db.Create(&models.ConversationParticipant{ConversationID: convoID, UserID: b, CreatedAt: now})
	}
}

// SendMessage supports attachments and normalizes content/text
func SendMessage(c *gin.Context) {
	senderID := c.GetString("user_id")
	receiverID := c.Param("id")
	if senderID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	if receiverID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "receiver id required"})
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

	var body struct {
		Content     string   `json:"content"`
		Text        string   `json:"text"`
		Attachments []string `json:"attachments"` // array of uploaded attachment URLs (client uploads first)
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	content := body.Content
	if content == "" {
		content = body.Text
	}
	if content == "" && len(body.Attachments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message content or attachments required"})
		return
	}

	convo := getOrCreateConversation(senderID, receiverID)
	m := models.Message{
		ConversationID: convo.ID,
		SenderID:       senderID,
		Content:        content,
	}
	if err := database.DB.Create(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save message"})
		return
	}

	// persist attachments if any
	for _, url := range body.Attachments {
		att := models.Attachment{MessageID: m.ID, URL: url}
		database.DB.Create(&att)
	}

	// ensure participant rows exist & update conversation map
	ensureParticipants(convo.ID, senderID, receiverID)
	realtime.Hub.EnsureParticipant(convo.ID, senderID)
	realtime.Hub.EnsureParticipant(convo.ID, receiverID)

	// prepare response payload
	var sender models.User
	database.DB.Select("id,display_name").Where("id = ?", senderID).First(&sender)

	// build attachments for response
	var atts []models.Attachment
	database.DB.Where("message_id = ?", m.ID).Find(&atts)

	data := gin.H{
		"id":              m.ID,
		"conversation_id": m.ConversationID,
		"sender_id":       m.SenderID,
		"fromName":        sender.DisplayName,
		"content":         m.Content,
		"attachments":     atts,
		"created_at":      m.CreatedAt,
	}

	realtime.Hub.BroadcastToConversation(convo.ID, gin.H{"event": "message", "data": data})

	isConnected := false
	var rel models.Connection
	if err := database.DB.Where(
		"((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = 'accepted'",
		senderID, receiverID, receiverID, senderID,
	).First(&rel).Error; err == nil {
		isConnected = true
	}
	notificationType := "message"
	if !isConnected {
		notificationType = "inmail"
	}

	// create notification (async)
	go CreateNotification(receiverID, senderID, notificationType, m.ID, map[string]interface{}{
		"snippet":         m.Content,
		"conversation_id": convo.ID,
		"inmail":          !isConnected,
	})

	c.JSON(http.StatusOK, gin.H{"message": data})
}

// UploadAttachment - multipart/form-data upload
func UploadAttachment(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, utils.MaxUploadSize)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}
	opened, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read file"})
		return
	}
	defer opened.Close()
	if err := utils.ValidateUpload(opened, file); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// sanitize and save
	uploadsDir := "uploads"
	os.MkdirAll(uploadsDir, 0755)
	id := uuid.NewString()
	ext := filepath.Ext(file.Filename)
	outName := id + ext
	dst := filepath.Join(uploadsDir, outName)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	// return public URL (if you host static files, map /uploads -> uploadsDir)
	base := os.Getenv("BACKEND_URL")
	if base == "" {
		base = os.Getenv("APP_URL")
	}
	if base == "" {
		base = "http://localhost:8000"
	}
	url := base + "/uploads/" + outName

	c.JSON(http.StatusOK, gin.H{"url": url, "fileName": file.Filename, "size": file.Size, "mime": file.Header.Get("Content-Type")})
}

// EditMessage - update message content
func EditMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	msgID := c.Param("id")
	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content required"})
		return
	}

	var msg models.Message
	if err := database.DB.Where("id = ?", msgID).First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	if msg.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	now := time.Now().UTC()
	database.DB.Model(&msg).Updates(map[string]interface{}{"content": body.Content, "edited_at": &now})

	// broadcast edit
	realtime.Hub.BroadcastToConversation(msg.ConversationID, gin.H{
		"event": "message_edited",
		"data":  gin.H{"id": msg.ID, "content": body.Content, "edited_at": now},
	})

	c.JSON(http.StatusOK, gin.H{"id": msg.ID, "content": body.Content, "edited_at": now})
}

// DeleteMessage - soft-delete; only sender can delete
func DeleteMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	msgID := c.Param("id")

	var msg models.Message
	if err := database.DB.Where("id = ?", msgID).First(&msg).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}
	if msg.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	now := time.Now().UTC()
	database.DB.Model(&msg).Update("deleted_at", &now)

	realtime.Hub.BroadcastToConversation(msg.ConversationID, gin.H{
		"event": "message_deleted",
		"data":  gin.H{"id": msg.ID, "deleted_at": now},
	})

	c.JSON(http.StatusOK, gin.H{"id": msg.ID})
}

// MarkAsRead - mark conversation messages as read by user, set LastReadAt on participant
func MarkAsRead(c *gin.Context) {
	userID := c.GetString("user_id")
	convoID := c.Param("id")
	now := time.Now().UTC()
	if !isConversationParticipant(convoID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}

	// update participant last read
	database.DB.Model(&models.ConversationParticipant{}).
		Where("conversation_id = ? AND user_id = ?", convoID, userID).
		Update("last_read_at", &now)

	// broadcast seen to the conversation participants
	realtime.Hub.BroadcastToConversation(convoID, gin.H{
		"event": "conversation_read",
		"data":  gin.H{"conversation_id": convoID, "user_id": userID, "last_read_at": now},
	})

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Typing indicator via REST endpoint (optional) — Fire-and-forget: server broadcasts typing event
func Typing(c *gin.Context) {
	userID := c.GetString("user_id")
	convoID := c.Param("id")
	var body struct {
		Typing bool `json:"typing"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "typing required"})
		return
	}
	if !isConversationParticipant(convoID, userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		return
	}
	realtime.Hub.BroadcastToConversation(convoID, gin.H{"event": "typing", "data": gin.H{"conversation_id": convoID, "from": userID, "typing": body.Typing}})
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func isConversationParticipant(conversationID, userID string) bool {
	var conversation models.Conversation
	return database.DB.Where(
		"id = ? AND (user1_id = ? OR user2_id = ?)",
		conversationID, userID, userID,
	).First(&conversation).Error == nil
}

func GetMessages(c *gin.Context) {
	userID := c.GetString("user_id")
	otherID := c.Param("id")
	if isInteractionBlocked(userID, otherID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	var convo models.Conversation
	db := database.DB

	if err := db.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		userID, otherID, otherID, userID,
	).First(&convo).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"messages": []models.Message{}, "conversation_id": ""})
		return
	}

	var messages []models.Message
	db.Where("conversation_id = ?", convo.ID).Order("created_at ASC").Find(&messages)

	// attach display names
	var users []models.User
	db.Where("id IN ?", []string{userID, otherID}).Find(&users)

	names := map[string]string{}
	for _, u := range users {
		names[u.ID] = u.DisplayName
	}

	response := []gin.H{}
	for _, m := range messages {
		var atts []models.Attachment
		db.Where("message_id = ?", m.ID).Find(&atts)
		response = append(response, gin.H{
			"id":          m.ID,
			"content":     m.Content,
			"sender_id":   m.SenderID,
			"fromName":    names[m.SenderID],
			"attachments": atts,
			"edited_at":   m.EditedAt,
			"deleted_at":  m.DeletedAt,
			"created_at":  m.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"messages": response, "conversation_id": convo.ID})
}

func GetUnreadMessageCount(c *gin.Context) {
	userID := c.GetString("user_id")

	type result struct {
		Count int64 `json:"count"`
	}
	var out result

	database.DB.Raw(`
		SELECT COUNT(*) AS count
		FROM messages m
		JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
		WHERE cp.user_id = ?
		  AND m.sender_id <> ?
		  AND m.deleted_at IS NULL
		  AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
	`, userID, userID).Scan(&out)

	c.JSON(http.StatusOK, gin.H{"count": out.Count})
}

func GetUserConversations(c *gin.Context) {
	userID := c.GetString("user_id")

	var convos []models.Conversation
	db := database.DB
	db.Where("user1_id = ? OR user2_id = ?", userID, userID).Find(&convos)

	response := []gin.H{}

	for _, convo := range convos {
		other := convo.User1ID
		if other == userID {
			other = convo.User2ID
		}
		if isInteractionBlocked(userID, other) {
			continue
		}

		// get user profile
		var u models.User
		db.Select("id, display_name").Where("id = ?", other).First(&u)
		var p models.Profile
		_ = db.Select("image_url").Where("user_id = ?", other).First(&p).Error

		// last message
		var last models.Message
		db.Where("conversation_id = ?", convo.ID).
			Order("created_at DESC").
			First(&last)

		response = append(response, gin.H{
			"id":              convo.ID,
			"userId":          u.ID,
			"displayName":     u.DisplayName,
			"avatar":          p.ImageURL,
			"lastMessage":     last.Content,
			"lastMessageTime": last.CreatedAt,
			"unreadCount":     0, // add later
			"isOnline":        realtime.Hub.IsUserOnline(u.ID),
		})
	}

	c.JSON(http.StatusOK, response)
}
