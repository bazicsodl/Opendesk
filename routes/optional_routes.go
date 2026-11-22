package routes

import (
	"opendesk/controllers"
	"opendesk/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterOptionalRoutes(router *gin.Engine) {
	// password reset
	router.POST("/auth/forgot-password", middleware.LimitForgotPassword(), controllers.ForgotPassword)
	router.POST("/auth/reset-password/:token", controllers.ResetPassword)

	// search
	router.GET("/search", controllers.Search)

	// block / unblock
	b := router.Group("/block")
	b.Use(middleware.AuthMiddleware())
	{
		b.GET("", controllers.GetBlocked)
		b.POST("/:id", controllers.BlockUser)
		b.POST("/:id/unblock", controllers.UnblockUser)
	}
}
