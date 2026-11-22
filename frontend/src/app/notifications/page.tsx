"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, Activity, UserPlus, MessageSquare, ThumbsUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { onNotification } from "@/lib/notifications-socket";
import { clearAuth, getToken } from "@/lib/auth";

export default function NotificationsPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (!getToken()) {
      clearAuth();
      router.replace("/auth/login");
      setLoading(false);
      return;
    }
    void loadNotifications();
    const unsub = onNotification((data) => {
      const normalized = normalizeIncoming(data);
      setNotes((prev) => [normalized, ...prev]);
    });
    return () => unsub();
  }, [router]);

  function normalizeIncoming(n: any) {
    let parsed = n?.data ?? n;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = { text: parsed };
      }
    }
    return {
      id: n.id || crypto.randomUUID(),
      type: n.type || parsed?.type || "activity",
      text: n.text || parsed?.text || parsed?.message || parsed?.snippet || "New notification",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await apiFetch("/notifications");
      const normalized = (Array.isArray(data) ? data : []).map((n: any) => {
        let parsed = n.data;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            parsed = { text: parsed };
          }
        }
        return {
          id: n.id || crypto.randomUUID(),
          type: n.type || "activity",
          text: parsed?.text || parsed?.message || parsed?.snippet || "New notification",
          isRead: Boolean(n.read),
          createdAt: n.created_at || new Date().toISOString(),
        };
      });
      setNotes(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.startsWith("401")) {
        clearAuth();
        router.replace("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await apiFetch(`/notifications/mark-read/${id}`, { method: "POST" });
  }

  async function markAll() {
    setNotes((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await apiFetch("/notifications/mark-all-read", { method: "POST" });
  }

  async function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await apiFetch(`/notifications/${id}`, { method: "DELETE" });
  }

  function iconFor(type: string) {
    if (type === "like") return <ThumbsUp className="h-4 w-4 text-red-500" />;
    if (type === "comment") return <MessageSquare className="h-4 w-4 text-emerald-600" />;
    if (type === "connection_accepted" || type === "connection_request" || type === "follow") return <UserPlus className="h-4 w-4 text-emerald-600" />;
    if (type === "message" || type === "inmail") return <MessageSquare className="h-4 w-4 text-amber-600" />;
    return <Activity className="h-4 w-4 text-slate-500" />;
  }

  const filtered = useMemo(
    () => (selectedType === "all" ? notes : notes.filter((n) => n.type === selectedType)),
    [notes, selectedType],
  );
  const unread = notes.filter((n) => !n.isRead).length;

  return (
    <div className="page-shell space-y-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Bell className="h-6 w-6 text-emerald-700" />
              Notifications
            </h1>
            <p className="page-subtitle">Track activity, responses, and hiring signals in one stream.</p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 ? <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">{unread} unread</span> : null}
            <button onClick={markAll} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
              Mark all read
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["all", "like", "comment", "message", "inmail", "connection_request", "connection_accepted"].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${selectedType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {type[0].toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? <div className="panel p-5 text-slate-600">Loading notifications...</div> : null}
        {!loading && filtered.length === 0 ? (
          <div className="panel p-8 text-center text-slate-600">No notifications in this category.</div>
        ) : null}

        {filtered.map((n) => (
          <article key={n.id} className={`panel p-4 ${!n.isRead ? "border-l-4 border-l-emerald-600" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-slate-100 p-2">{iconFor(n.type)}</div>
              <div className="flex-1">
                <p className="text-slate-800">{n.text}</p>
                <p className="mt-1 text-sm text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                {!n.isRead ? (
                  <button onClick={() => markRead(n.id)} className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600">
                    <Check className="h-4 w-4" />
                  </button>
                ) : null}
                <button onClick={() => remove(n.id)} className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
