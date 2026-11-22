package middleware


import (
"net/http"
"sync"
"time"
"strconv"


"github.com/gin-gonic/gin"
"github.com/patrickmn/go-cache"
)


type limiterEntry struct {
count int
reset time.Time
}

var rateCache = cache.New(1*time.Hour, 10*time.Minute)
var limiterMu sync.Mutex
var limiterMap = make(map[string]*limiterEntry)


func RateLimiter(maxPerMin int) gin.HandlerFunc {
return func(c *gin.Context) {
ip := c.ClientIP()
limiterMu.Lock()
e, ok := limiterMap[ip]
if !ok || time.Now().After(e.reset) {
limiterMap[ip] = &limiterEntry{count: 1, reset: time.Now().Add(time.Minute)}
limiterMu.Unlock()
c.Next()
return
}


if e.count >= maxPerMin {
ttl := int(time.Until(e.reset).Seconds())
limiterMu.Unlock()
c.Header("Retry-After", strconv.Itoa(ttl))
c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
c.Abort()
return
}


e.count++
limiterMu.Unlock()
c.Next()
}
}

func LimitForgotPassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		count, found := rateCache.Get(ip)
		if found && count.(int) >= 3 {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many attempts. Try again later.",
			})
			c.Abort()
			return
		}

		if !found {
			rateCache.Set(ip, 1, cache.DefaultExpiration)
		} else {
			rateCache.Set(ip, count.(int)+1, cache.DefaultExpiration)
		}

		c.Next()
	}
}