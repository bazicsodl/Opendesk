package controllers


import (
"net/http"


"github.com/gin-gonic/gin"
"opendesk/database"
"opendesk/models"
)


// GET /admin/users
func AdminListUsers(c *gin.Context) {
var users []models.User
database.DB.Find(&users)
c.JSON(http.StatusOK, users)
}


// DELETE /admin/users/:id
func AdminDeleteUser(c *gin.Context) {
id := c.Param("id")
database.DB.Where("id = ?", id).Delete(&models.User{})
c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}


// GET /admin/posts
func AdminListPosts(c *gin.Context) {
var posts []models.Post
database.DB.Find(&posts)
c.JSON(http.StatusOK, posts)
}


// DELETE /admin/posts/:id
func AdminDeletePost(c *gin.Context) {
id := c.Param("id")
database.DB.Where("id = ?", id).Delete(&models.Post{})
c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}