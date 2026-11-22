package realtime

import (
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type NotificationClient struct {
	UserID string
	Conn   *websocket.Conn
}

type NotificationHubStruct struct {
	clients map[string]map[*websocket.Conn]bool
	lock    sync.RWMutex
}

var NotificationHub = &NotificationHubStruct{
	clients: make(map[string]map[*websocket.Conn]bool),
}

func (h *NotificationHubStruct) Register(c *NotificationClient) {
	h.lock.Lock()
	defer h.lock.Unlock()

	if h.clients[c.UserID] == nil {
		h.clients[c.UserID] = make(map[*websocket.Conn]bool)
	}
	h.clients[c.UserID][c.Conn] = true
}

func (h *NotificationHubStruct) Unregister(userID string, conn *websocket.Conn) {
	h.lock.Lock()
	defer h.lock.Unlock()

	if h.clients[userID] != nil {
		delete(h.clients[userID], conn)
		if len(h.clients[userID]) == 0 {
			delete(h.clients, userID)
		}
	}
}

func (h *NotificationHubStruct) Send(userID string, payload interface{}) {
	h.lock.RLock()
	conns := h.clients[userID]
	h.lock.RUnlock()

	for conn := range conns {
		if err := conn.WriteJSON(payload); err != nil {
			log.Printf("NotificationHub: write error to %s - %v. Unregistering.", userID, err)
			h.Unregister(userID, conn)
			conn.Close()
		}
	}
}
