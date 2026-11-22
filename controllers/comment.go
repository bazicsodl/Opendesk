package controllers

import (
	"net/http"
	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
)

// CreateComment POST /posts/:postId/comments
func CreateComment(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("postId")

	var body struct {
		Content string `json:"content"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var post models.Post
	if err := database.DB.First(&post, "id = ?", postID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	if isInteractionBlocked(userID, post.UserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	var user models.User
	database.DB.First(&user, "id = ?", userID)

	comment := models.Comment{
		PostID:  postID,
		UserID:  userID,
		Content: body.Content,
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
		return
	}

	result := gin.H{
		"id":         comment.ID,
		"text":       comment.Content,
		"createdAt":  comment.CreatedAt,
		"authorName": user.DisplayName,
	}

	// Notify post owner asynchronously
	if post.UserID != userID {
		go CreateNotification(post.UserID, userID, "comment", comment.ID, map[string]interface{}{
			"message": body.Content,
			"post_id": post.ID,
		})
	}

	c.JSON(http.StatusOK, result)
}

// GetComments GET /posts/:postId/comments
func GetComments(c *gin.Context) {
	postID := c.Param("postId")

	var comments []models.Comment
	database.DB.Preload("User").Where("post_id = ?", postID).Order("created_at ASC").Find(&comments)

	// transform backend model → frontend shape
	var result []gin.H
	for _, cm := range comments {
		result = append(result, gin.H{
			"id":         cm.ID,
			"text":       cm.Content,
			"createdAt":  cm.CreatedAt,
			"authorName": cm.User.DisplayName,
		})
	}

	c.JSON(http.StatusOK, result)
}

// DeleteComment DELETE /comments/:id
func DeleteComment(c *gin.Context) {
	userID := c.GetString("user_id")
	commentID := c.Param("id")

	var comment models.Comment
	result := database.DB.First(&comment, "id = ?", commentID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not allowed"})
		return
	}

	database.DB.Delete(&comment)
	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted"})
}
