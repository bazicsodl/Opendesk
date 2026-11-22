// controllers/websockets.go
package controllers

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"opendesk/realtime"
	"opendesk/utils"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

var wsAllowedOrigins = map[string]struct{}{}
var wsAllowedHosts = map[string]struct{}{}

func init() {
	raw := os.Getenv("WS_ALLOWED_ORIGINS")
	if app := os.Getenv("APP_URL"); app != "" {
		if raw == "" {
			raw = app
		} else {
			raw = raw + "," + app
		}
	}
	if frontend := os.Getenv("FRONTEND_URL"); frontend != "" {
		if raw == "" {
			raw = frontend
		} else {
			raw = raw + "," + frontend
		}
	}
	if raw == "" {
		raw = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
	}
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimRight(strings.TrimSpace(o), "/")
		if o != "" {
			wsAllowedOrigins[o] = struct{}{}
			if parsed, err := url.Parse(o); err == nil && parsed.Host != "" {
				wsAllowedHosts[parsed.Host] = struct{}{}
			}
		}
	}

	upgrader.CheckOrigin = func(r *http.Request) bool {
		origin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
		if origin == "" {
			return true
		}
		if _, ok := wsAllowedOrigins[origin]; ok {
			return true
		}

		parsedOrigin, err := url.Parse(origin)
		if err != nil {
			return false
		}
		if _, ok := wsAllowedHosts[parsedOrigin.Host]; ok {
			return true
		}
		return parsedOrigin.Host == r.Host
	}
}

// helper: extract uid from ?token= or ?uid=
func extractUID(c *gin.Context) (string, error) {
	token := c.Query("token")
	if token == "" {
		return "", errors.New("missing token")
	}

	uid, err := utils.VerifyToken(token)
	if err != nil || uid == "" {
		return "", errors.New("invalid token")
	}

	return uid, nil
}

const (
	// tuning
	wsReadTimeout  = 60 * time.Second
	wsWriteTimeout = 10 * time.Second
	wsPingPeriod   = 20 * time.Second
	wsMaxMsgSize   = 1024 * 32
)

// ChatWebSocket handler
func ChatWebSocket(c *gin.Context) {
	uid, err := extractUID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("ChatWebSocket upgrade failed: %v", err)
		return
	}

	// set read limits and deadlines
	conn.SetReadLimit(wsMaxMsgSize)
	conn.SetReadDeadline(time.Now().Add(wsReadTimeout))
	conn.SetPongHandler(func(appData string) error {
		conn.SetReadDeadline(time.Now().Add(wsReadTimeout))
		return nil
	})

	client := &realtime.ChatClient{UserID: uid, Conn: conn}
	realtime.Hub.RegisterClient(client)

	defer func() {
		realtime.Hub.UnregisterConnection(uid, conn)
		conn.Close()
	}()

	// Keep alive: ping loop
	go func() {
		t := time.NewTicker(wsPingPeriod)
		defer t.Stop()
		for {
			<-t.C
			conn.SetWriteDeadline(time.Now().Add(wsWriteTimeout))
			if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(wsWriteTimeout)); err != nil {
				log.Printf("Chat ping failed for %s: %v", uid, err)
				return
			}
		}
	}()

	// Read loop
	for {
		var msg map[string]interface{}
		if err := conn.ReadJSON(&msg); err != nil {
			// client disconnected or protocol error
			log.Printf("Chat read error (%s): %v", uid, err)
			return
		}
		// TODO: handle message
	}
}

// NotificationWebSocket handler
func NotificationWebSocket(c *gin.Context) {
	uid, err := extractUID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("NotificationWebSocket upgrade failed: %v", err)
		return
	}

	conn.SetReadLimit(wsMaxMsgSize)
	conn.SetReadDeadline(time.Now().Add(wsReadTimeout))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(wsReadTimeout))
		return nil
	})

	client := &realtime.NotificationClient{UserID: uid, Conn: conn}
	realtime.NotificationHub.Register(client)

	defer func() {
		realtime.NotificationHub.Unregister(uid, conn)
		conn.Close()
	}()

	// keep alive: ping
	go func() {
		t := time.NewTicker(wsPingPeriod)
		defer t.Stop()
		for {
			<-t.C
			conn.SetWriteDeadline(time.Now().Add(wsWriteTimeout))
			if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(wsWriteTimeout)); err != nil {
				log.Printf("Notification ping failed for %s: %v", uid, err)
				return
			}
		}
	}()

	// Only read to keep websocket alive
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			log.Printf("Notification read error (%s): %v", uid, err)
			return
		}
	}
}
