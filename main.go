package main

import (
	"log"
	"os"
	"opendesk/database"
	"opendesk/middleware"
	"opendesk/routes"
	workers "opendesk/worker"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func parseCSV(value string) []string {
	items := strings.Split(value, ",")
	out := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item != "" {
			out = append(out, item)
		}
	}
	return out
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	database.Connect()
	workers.StartJobAlertWorker()

	router := gin.Default()
	router.Use(middleware.CORSMiddleware())

	trustedProxies := parseCSV(os.Getenv("TRUSTED_PROXIES"))
	if len(trustedProxies) == 0 {
		trustedProxies = []string{"127.0.0.1", "::1"}
	}
	if err := router.SetTrustedProxies(trustedProxies); err != nil {
		log.Fatal("Failed to set trusted proxies:", err)
	}

	router.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(200)
	})
	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	routes.RegisterRoutes(router)
	routes.RegisterOptionalRoutes(router)
	router.Static("/uploads", "./uploads")

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8000"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Server failed:", err)
	}
}
