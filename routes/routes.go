package routes

import (
	"opendesk/controllers"
	"opendesk/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {

	// --- AUTH ---
	auth := router.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", middleware.LoginRateLimit(), controllers.Login)
		auth.POST("/send-verification", middleware.AuthMiddleware(), controllers.SendVerification)
		auth.GET("/verify-email", controllers.VerifyEmail)

	}

	// --- WS ---
	ws := router.Group("/ws") // ❌ no middleware
	{
		ws.GET("/chat", controllers.ChatWebSocket)
		ws.GET("/notifications", controllers.NotificationWebSocket)
	}

	// --- PROFILE ---
	profile := router.Group("/profile")
	profile.Use(middleware.AuthMiddleware())
	{
		profile.POST("", controllers.CreateOrUpdateProfile)
		profile.GET("/me", controllers.GetMyProfile)
	}

	router.GET("/profile/:id", controllers.GetProfile)

	// --- POSTS ---
	post := router.Group("/posts")
	post.Use(middleware.AuthMiddleware())
	{
		post.POST("", controllers.CreatePost)
		post.POST("/", controllers.CreatePost)
		post.POST("/:id/like", controllers.LikePost)
	}

	router.GET("/feed", middleware.AuthMiddleware(), controllers.GetFeed)
	router.GET("/user/:id/posts", controllers.GetUserPosts)

	// --- COMMENTS ---
	comment := router.Group("/comments")
	comment.Use(middleware.AuthMiddleware())
	{
		comment.POST("/:postId", controllers.CreateComment)
		comment.DELETE("/:id", controllers.DeleteComment)
	}

	router.GET("/comments/:postId", controllers.GetComments)

	// --- CONNECTIONS ---
	connection := router.Group("/connections")
	connection.Use(middleware.AuthMiddleware())
	{
		connection.POST("/send/:id", controllers.SendConnectionRequest)
		connection.POST("/accept/:id", controllers.AcceptConnection)
		connection.POST("/reject/:id", controllers.RejectConnection)
		connection.GET("/pending", controllers.GetPendingRequests)
		// NEW: Gets logged-in user's connections
		connection.GET("/me", controllers.GetMyConnections)
		// Gets any user's connections by ID
		connection.GET("/user/:id", controllers.GetUserConnections)

	}

	// --- MESSAGES ---
	messages := router.Group("/messages")
	messages.Use(middleware.AuthMiddleware())
	{
		messages.POST("/send/:id", controllers.SendMessage)
		messages.GET("/with/:id", controllers.GetMessages)
		messages.GET("/conversations", controllers.GetUserConversations)
		messages.GET("/unread-count", controllers.GetUnreadMessageCount)

		messages.POST("/upload", controllers.UploadAttachment)
		messages.PUT("/:id", controllers.EditMessage)
		messages.DELETE("/:id", controllers.DeleteMessage)
		messages.POST("/:id/read", controllers.MarkAsRead)
		messages.POST("/:id/typing", controllers.Typing)

	}

	// --- NOTIFICATIONS ---
	notifications := router.Group("/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		notifications.GET("", controllers.ListNotifications)
		notifications.GET("/unread-count", controllers.GetUnreadNotificationCount)
		notifications.POST("/mark-read/:id", controllers.MarkRead)
		notifications.POST("/mark-all-read", controllers.MarkAllRead)
		notifications.DELETE("/:id", controllers.DeleteNotification)
	}

	jobs := router.Group("/jobs")
	jobs.Use(middleware.AuthMiddleware())
	{
		// STATIC ROUTES FIRST
		jobs.POST("/", controllers.CreateJob)
		jobs.GET("/", controllers.GetJobs)

		jobs.GET("/preferences", controllers.GetUserPreference)
		jobs.POST("/preferences", controllers.UpsertUserPreference)

		jobs.GET("/recommended", controllers.GetRecommendedJobsAdvanced)

		// Management & extra static routes
		jobs.GET("/:id/applications", controllers.GetJobApplications)
		jobs.GET("/:id/people-also-applied", controllers.PeopleAlsoApplied)
		jobs.POST("/:id/boost", controllers.SetJobBoost)
		jobs.PUT("/applications/:id/review", controllers.ReviewApplication)
		jobs.POST("/:id/track", controllers.TrackJobEvent)
		jobs.GET("/:id/metrics", controllers.GetJobMetrics)
		jobs.POST("/:id/apply", controllers.ApplyForJob)

		jobs.PUT("/:id", controllers.EditJob)
		jobs.DELETE("/:id", controllers.DeleteJob)

		jobs.POST("/:id/message", controllers.SendMessageToApplicant)
		jobs.GET("/:id/messages/:applicantId", controllers.GetMessagesForApplicant)

		// PARAM ROUTE LAST (CATCH-ALL)
		jobs.GET("/:id", controllers.GetJobByID)
	}

	recruiter := router.Group("/recruiter")
	recruiter.Use(middleware.AuthMiddleware())
	{
		recruiter.POST("/create", controllers.CreateRecruiterProfile)
		recruiter.GET("/me", controllers.GetMyRecruiterProfile)
		recruiter.GET("/jobs", controllers.GetRecruiterJobs)
		recruiter.GET("/jobs/:id", controllers.GetRecruiterJobByID)
		recruiter.DELETE("/jobs/:id", controllers.DeleteJob)
		recruiter.GET("/jobs/:id/applicants", controllers.GetRecruiterJobApplicants)
		recruiter.GET("/applicants/:id", controllers.GetRecruiterApplicant)
		recruiter.POST("/applications/:id/:action", controllers.RecruiterReviewApplication)
	}

	upload := router.Group("/upload")
	upload.Use(middleware.AuthMiddleware())
	{
		upload.POST("", controllers.UploadImage)
	}

	users := router.Group("/users")
	users.Use(middleware.AuthMiddleware())
	{
		users.GET("/suggested", controllers.GetSuggestedUsers)
	}

}
