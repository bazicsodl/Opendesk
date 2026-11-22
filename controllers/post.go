package controllers

import (
	"errors"
	"net/http"

	"opendesk/database"
	"opendesk/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreatePost(c *gin.Context) {
	userID := c.GetString("user_id")

	var body struct {
		Content   string `json:"content"`
		ImageURL  string `json:"image_url"`
		MediaURL  string `json:"media_url"`
		MediaType string `json:"media_type"`
		MediaName string `json:"media_name"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	mediaURL := body.ImageURL
	if mediaURL == "" {
		mediaURL = body.MediaURL
	}
	mediaType := body.MediaType
	if mediaType == "" {
		mediaType = "image"
	}

	post := models.Post{
		UserID:    userID,
		Content:   body.Content,
		ImageURL:  mediaURL,
		MediaType: mediaType,
		MediaName: body.MediaName,
	}

	if err := database.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func GetFeed(c *gin.Context) {
	userID := c.GetString("user_id")

	var posts []models.Post
	database.DB.
		Preload("User").
		Preload("Comments").
		Where("NOT EXISTS (SELECT 1 FROM blocks WHERE (blocks.user_id = ? AND blocks.blocked_id = posts.user_id) OR (blocks.user_id = posts.user_id AND blocks.blocked_id = ?))", userID, userID).
		Order("created_at DESC").
		Find(&posts)

	result := make([]gin.H, 0, len(posts))

	for _, p := range posts {
		var authorProfile models.Profile
		_ = database.DB.Select("image_url").Where("user_id = ?", p.UserID).First(&authorProfile).Error

		var userLikeCount int64
		database.DB.
			Model(&models.PostLike{}).
			Where("post_id = ? AND user_id = ?", p.ID, userID).
			Count(&userLikeCount)

		var totalLikes int64
		database.DB.Model(&models.PostLike{}).Where("post_id = ?", p.ID).Count(&totalLikes)

		result = append(result, gin.H{
			"id":             p.ID,
			"content":        p.Content,
			"image_url":      p.ImageURL,
			"media_url":      p.ImageURL,
			"media_type":     p.MediaType,
			"media_name":     p.MediaName,
			"authorId":       p.User.ID,
			"authorName":     p.User.DisplayName,
			"authorImageUrl": authorProfile.ImageURL,
			"createdAt":      p.CreatedAt,
			"likes":          totalLikes,
			"commentsCount":  len(p.Comments),
			"userHasLiked":   userLikeCount > 0,
		})
	}

	c.JSON(http.StatusOK, result)
}

func GetUserPosts(c *gin.Context) {
	userID := c.Param("id")

	var posts []models.Post
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&posts)

	out := make([]gin.H, 0, len(posts))
	for _, p := range posts {
		out = append(out, gin.H{
			"id":         p.ID,
			"user_id":    p.UserID,
			"content":    p.Content,
			"image_url":  p.ImageURL,
			"media_url":  p.ImageURL,
			"media_type": p.MediaType,
			"media_name": p.MediaName,
			"likes":      p.Likes,
			"created_at": p.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, out)
}

func LikePost(c *gin.Context) {
	userID := c.GetString("user_id")
	postID := c.Param("id")

	var post models.Post
	if err := database.DB.First(&post, "id = ?", postID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}
	if isInteractionBlocked(userID, post.UserID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "interaction unavailable"})
		return
	}

	var existing models.PostLike
	err := database.DB.Where("post_id = ? AND user_id = ?", postID, userID).First(&existing).Error

	liked := false

	switch {
	case err == nil:
		database.DB.Delete(&existing)
		liked = false
	case errors.Is(err, gorm.ErrRecordNotFound):
		like := models.PostLike{PostID: postID, UserID: userID}
		if createErr := database.DB.Create(&like).Error; createErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to like post"})
			return
		}
		liked = true

		if post.UserID != userID {
			go CreateNotification(post.UserID, userID, "like", post.ID, map[string]interface{}{
				"message": "Someone liked your post",
			})
		}
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update like"})
		return
	}

	var totalLikes int64
	database.DB.Model(&models.PostLike{}).Where("post_id = ?", postID).Count(&totalLikes)
	database.DB.Model(&post).Update("likes", totalLikes)

	c.JSON(http.StatusOK, gin.H{
		"likes": totalLikes,
		"liked": liked,
	})
}
