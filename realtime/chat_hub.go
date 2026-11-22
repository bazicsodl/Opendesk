// realtime/hub.go
package realtime

import (
    "log"
    "sync"

    "github.com/gorilla/websocket"
)

type ChatClient struct {
    UserID string
    Conn   *websocket.Conn
}

type ChatHub struct {
    clients       map[string]map[*websocket.Conn]bool
    conversations map[string]map[string]struct{}
    lock          sync.RWMutex
}

var Hub = &ChatHub{
    clients:       make(map[string]map[*websocket.Conn]bool),
    conversations: make(map[string]map[string]struct{}),
}

func (h *ChatHub) RegisterClient(c *ChatClient) {
    h.lock.Lock()
    defer h.lock.Unlock()
    if h.clients[c.UserID] == nil {
        h.clients[c.UserID] = make(map[*websocket.Conn]bool)
    }
    h.clients[c.UserID][c.Conn] = true
}

func (h *ChatHub) UnregisterConnection(userID string, conn *websocket.Conn) {
    h.lock.Lock()
    defer h.lock.Unlock()
    if h.clients[userID] != nil {
        delete(h.clients[userID], conn)
        if len(h.clients[userID]) == 0 {
            delete(h.clients, userID)
        }
    }
}

func (h *ChatHub) IsUserOnline(userID string) bool {
    h.lock.RLock()
    defer h.lock.RUnlock()
    return len(h.clients[userID]) > 0
}

func (h *ChatHub) Send(userID string, payload interface{}) {
    h.lock.RLock()
    conns := h.clients[userID]
    h.lock.RUnlock()
    for conn := range conns {
        if err := conn.WriteJSON(payload); err != nil {
            log.Printf("ChatHub: write error to %s - %v. Unregistering conn.", userID, err)
            h.UnregisterConnection(userID, conn)
            conn.Close()
        }
    }
}

func (h *ChatHub) EnsureParticipant(convoID, userID string) {
    h.lock.Lock()
    defer h.lock.Unlock()
    if h.conversations[convoID] == nil {
        h.conversations[convoID] = make(map[string]struct{})
    }
    h.conversations[convoID][userID] = struct{}{}
}

func (h *ChatHub) BroadcastToConversation(convoID string, payload interface{}) {
    h.lock.RLock()
    users := h.conversations[convoID]
    h.lock.RUnlock()
    for userID := range users {
        h.Send(userID, payload)
    }
}

// Broadcast helpers for common events
func (h *ChatHub) BroadcastTyping(convoID, fromUserID string, typing bool) {
    payload := map[string]interface{}{
        "event": "typing",
        "data": map[string]interface{}{
            "conversation_id": convoID,
            "from":            fromUserID,
            "typing":          typing,
        },
    }
    h.BroadcastToConversation(convoID, payload)
}
