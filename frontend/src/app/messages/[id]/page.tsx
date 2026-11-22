"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, API_BASE } from "../../../lib/api";
import { getToken, getUser } from "../../../lib/auth";
import { CheckCheck, Paperclip, Send, SquarePen, Trash2, User } from "lucide-react";

type Message = {
  id: string;
  conversation_id?: string;
  content: string;
  sender_id: string;
  fromName?: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  attachments?: { id?: string; url: string }[];
};

export default function Chat() {
  const params = useParams();
  const id = params.id as string;
  const me = getUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState("");
  const [typing, setTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([]);

  async function loadMessages() {
    const res = await apiFetch(`/messages/with/${id}`);
    setMessages(res.messages || []);
    setConversationId(res.conversation_id || "");
    if (res.conversation_id) {
      await apiFetch(`/messages/${res.conversation_id}/read`, { method: "POST" });
    }
  }

  useEffect(() => {
    loadMessages().catch(console.error);
    apiFetch(`/profile/${id}`).then(setOtherUser).catch(() => {});
  }, [id]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const wsUrl = `${API_BASE.replace(/^http/, "ws")}/ws/chat?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === "message") {
          const incoming = payload.data as Message;
          if (incoming.sender_id === id || incoming.sender_id === me?.id) {
            setMessages((prev) => [...prev, incoming]);
            if (incoming.sender_id === id && incoming.conversation_id) {
              apiFetch(`/messages/${incoming.conversation_id}/read`, { method: "POST" }).catch(() => {});
            }
          }
        }
        if (payload?.event === "message_edited") {
          setMessages((prev) => prev.map((m) => (m.id === payload.data?.id ? { ...m, content: payload.data.content, edited_at: payload.data.edited_at } : m)));
        }
        if (payload?.event === "message_deleted") {
          setMessages((prev) => prev.map((m) => (m.id === payload.data?.id ? { ...m, deleted_at: payload.data.deleted_at } : m)));
        }
        if (payload?.event === "typing" && payload?.data?.from === id) {
          setTyping(Boolean(payload.data.typing));
        }
      } catch {}
    };

    return () => ws.close();
  }, [id, me?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function notifyTyping(isTyping: boolean) {
    if (!conversationId) return;
    await apiFetch(`/messages/${conversationId}/typing`, {
      method: "POST",
      body: JSON.stringify({ typing: isTyping }),
    });
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!text.trim() && pendingAttachments.length === 0) || isSending) return;
    setIsSending(true);
    try {
      await apiFetch(`/messages/send/${id}`, {
        method: "POST",
        body: JSON.stringify({ content: text.trim(), attachments: pendingAttachments }),
      });
      setText("");
      setPendingAttachments([]);
      await loadMessages();
      await notifyTyping(false);
    } finally {
      setIsSending(false);
    }
  }

  async function uploadAttachment(file: File) {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/messages/upload", { method: "POST", body: form });
      if (res?.url) {
        setPendingAttachments((prev) => [...prev, res.url]);
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function editMessage(msg: Message) {
    const next = window.prompt("Edit message", msg.content);
    if (!next || next.trim() === msg.content) return;
    await apiFetch(`/messages/${msg.id}`, { method: "PUT", body: JSON.stringify({ content: next.trim() }) });
    await loadMessages();
  }

  async function deleteMessage(msg: Message) {
    if (!confirm("Delete this message?")) return;
    await apiFetch(`/messages/${msg.id}`, { method: "DELETE" });
    await loadMessages();
  }

  const meId = me?.id ?? "";
  const headerName = otherUser?.name || "Conversation";
  const inmailMode = otherUser?.connection_status !== "accepted";
  const canSend = useMemo(() => !!text.trim() || pendingAttachments.length > 0, [text, pendingAttachments.length]);

  return (
    <div className="w-full h-full flex flex-col max-w-none">
      <div className="border-b border-slate-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-amber-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">{headerName}</h1>
            <div className="text-sm text-slate-500">
              {typing ? "Typing..." : inmailMode ? "InMail conversation" : "Connected chat"}
            </div>
          </div>
        </div>
        {inmailMode ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            You are not connected yet. Messages here are sent as InMail.
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#f8fbf8] to-white">
        <div className="space-y-4">
          {messages.map((m) => {
            const isOwn = m.sender_id === meId;
            const isDeleted = Boolean(m.deleted_at);
            return (
              <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 shadow-sm ${isOwn ? "bg-emerald-700 text-white" : "bg-white border border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${isOwn ? "text-emerald-50" : "text-slate-700"}`}>{isOwn ? "You" : (m.fromName || headerName)}</span>
                    <span className={`text-xs ${isOwn ? "text-emerald-100" : "text-slate-500"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {m.edited_at ? <span className={`text-[10px] ${isOwn ? "text-emerald-100" : "text-slate-500"}`}>(edited)</span> : null}
                  </div>
                  <p className={`${isDeleted ? "italic opacity-70" : ""} ${isOwn ? "text-white" : "text-slate-800"}`}>{isDeleted ? "Message deleted" : m.content}</p>
                  {m.attachments?.length ? (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((a, idx) => (
                        <a key={`${m.id}-${idx}`} href={a.url} target="_blank" className={`block underline text-xs ${isOwn ? "text-emerald-50" : "text-emerald-700"}`} rel="noreferrer">
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {isOwn && !isDeleted ? (
                    <div className="mt-2 flex justify-end gap-1">
                      <button type="button" onClick={() => editMessage(m)} className="rounded p-1 hover:bg-white/20">
                        <SquarePen className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteMessage(m)} className="rounded p-1 hover:bg-white/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-100" />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={send} className="border-t border-slate-200 p-4 bg-white">
        {pendingAttachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingAttachments.map((u, i) => (
              <span key={`${u}-${i}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                File {i + 1}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-2">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                notifyTyping(true).catch(() => {});
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => {
                  notifyTyping(false).catch(() => {});
                }, 900);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Write your message..."
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-slate-900"
              rows={1}
            />
          </div>

          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAttachment(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} className="p-3 border border-slate-200 text-slate-600 rounded-full hover:bg-emerald-50 disabled:opacity-50" disabled={isUploading}>
            <Paperclip className="w-5 h-5" />
          </button>
          <button type="submit" disabled={isSending || !canSend} className="p-3 bg-emerald-700 text-white rounded-full hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
