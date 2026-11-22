import { API_BASE } from "./api";
import { getToken } from "./auth";

type NotificationHandler = (data: any) => void;

let ws: WebSocket | null = null;
let handlers: NotificationHandler[] = [];
let reconnectTimer: number | null = null;
let reconnectAttempts = 0;
let lastTokenUsed: string | null = null;
let manuallyClosed = false;

function buildWSUrl(base: string, token: string) {
  let url = (base || "").trim();
  if (!url) throw new Error("Missing API base URL");

  // Normalize to WS origin so values like http://host:8000/api still connect to /ws/notifications.
  try {
    const parsed = new URL(url);
    const wsProto = parsed.protocol === "https:" ? "wss:" : parsed.protocol === "http:" ? "ws:" : parsed.protocol;
    url = `${wsProto}//${parsed.host}`;
  } catch {
    if (url.endsWith("/")) url = url.slice(0, -1);
    if (url.startsWith("https://")) url = "wss://" + url.slice("https://".length);
    else if (url.startsWith("http://")) url = "ws://" + url.slice("http://".length);
    else if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      const proto = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss://" : "ws://";
      url = proto + url;
    }
  }

  return `${url}/ws/notifications?token=${encodeURIComponent(token)}`;
}

function notifyAll(payload: any) {
  handlers.forEach((h) => h(payload));
}

function attachSocketHandlers(socket: WebSocket) {
  socket.onopen = () => {
    reconnectAttempts = 0;
  };

  socket.onmessage = (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      if (payload?.event === "notification" && payload?.data) {
        notifyAll(payload.data);
      } else {
        notifyAll(payload);
      }
    } catch {
      notifyAll({ text: "New notification" });
    }
  };

  socket.onclose = () => {
    if (manuallyClosed) return;
    reconnectAttempts += 1;
    const backoff = Math.min(30000, Math.floor(1000 * 1.5 ** reconnectAttempts));
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connectNotifications(lastTokenUsed || undefined);
    }, backoff);
  };
}

export function connectNotifications(token?: string) {
  if (typeof window === "undefined") return;
  const nextToken = token || getToken() || undefined;

  if (ws) {
    if (nextToken && nextToken !== lastTokenUsed) {
      disconnectNotifications();
    } else {
      return;
    }
  }

  lastTokenUsed = nextToken || null;
  manuallyClosed = false;
  if (!nextToken) return;

  const url = buildWSUrl(API_BASE, nextToken);
  ws = new WebSocket(url);
  attachSocketHandlers(ws);
}

export function onNotification(cb: NotificationHandler) {
  handlers.push(cb);
  return () => {
    handlers = handlers.filter((h) => h !== cb);
  };
}

export function disconnectNotifications() {
  manuallyClosed = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) ws.close(1000, "client disconnect");
  ws = null;
  lastTokenUsed = null;
}

export function isConnected() {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export function getSocket() {
  return ws;
}
