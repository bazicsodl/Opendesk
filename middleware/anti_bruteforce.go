package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

type loginAttemptsData struct {
	count     int
	lastTry   time.Time
	lockedUntil time.Time
}

var loginAttempts = struct {
	sync.Mutex
	data map[string]*loginAttemptsData
}{data: map[string]*loginAttemptsData{}}

func LoginRateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		var body struct {
			Email string `json:"email"`
		}
		_ = c.ShouldBindBodyWith(&body, binding.JSON)
		email := body.Email
		if email == "" {
			email = c.PostForm("email")
		}
		key := ip + "_" + email

		loginAttempts.Lock()
		la, ok := loginAttempts.data[key]
		now := time.Now()

		if !ok {
			la = &loginAttemptsData{}
			loginAttempts.data[key] = la
		}

		// Still locked?
		if la.lockedUntil.After(now) {
			until := la.lockedUntil.Format(time.RFC822)
			loginAttempts.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Account temporarily locked. Try again at " + until,
			})
			c.Abort()
			return
		}

		loginAttempts.Unlock()
		c.Next()

		// After controller runs, check success or fail
		status := c.Writer.Status()
		if status == http.StatusUnauthorized {
			loginAttempts.Lock()

			la.count++
			la.lastTry = now

			if la.count >= 5 {
				la.lockedUntil = now.Add(15 * time.Minute)
			}

			loginAttempts.Unlock()
			return
		}

		// On successful login, reset attempts
		if status == http.StatusOK {
			loginAttempts.Lock()
			delete(loginAttempts.data, key)
			loginAttempts.Unlock()
		}
	}
}
