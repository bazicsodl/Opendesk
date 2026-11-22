package controllers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "opendesk/database"
    "opendesk/models"
)

// GET /search?query=...
func Search(c *gin.Context) {
    q := c.Query("query")
    if q == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "query required"})
        return
    }

    type SearchUser struct {
        ID          string `json:"id"`
        DisplayName string `json:"display_name"`
        Name        string `json:"displayName"`
        Headline    string `json:"headline"`
        ImageURL    string `json:"image_url"`
    }

    var users []SearchUser
    var posts []struct {
        models.Post
        AuthorName string `json:"author_name"`
    }
    var jobs []models.Job

    database.DB.Table("users").
        Select("users.id, users.display_name, profiles.headline, profiles.image_url").
        Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
        Where("users.display_name ILIKE ?", "%"+q+"%").
        Limit(20).
        Scan(&users)

    for i := range users {
        users[i].Name = users[i].DisplayName
    }

    database.DB.Table("posts").
        Select("posts.*, users.display_name AS author_name").
        Joins("LEFT JOIN users ON users.id = posts.user_id").
        Where("posts.content ILIKE ?", "%"+q+"%").
        Order("posts.created_at DESC").
        Limit(50).
        Scan(&posts)

    database.DB.Table("jobs").
        Where("title ILIKE ? OR company ILIKE ? OR description ILIKE ?", "%"+q+"%", "%"+q+"%", "%"+q+"%").
        Order("created_at DESC").
        Limit(30).
        Scan(&jobs)

    c.JSON(http.StatusOK, gin.H{
        "users": users,
        "posts": posts,
        "jobs":  jobs,
    })
}
