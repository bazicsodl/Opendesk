'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Circle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Convo = {
  userId: string;
  displayName: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageType?: string | null;
  lastMessageTime?: string | null;
  unreadCount?: number;
  isOnline?: boolean;
  typing?: boolean;
  seenAt?: string | null;
};

export default function ChatSidebar() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    apiFetch('/messages/conversations')
      .then((res: Convo[]) => {
        if (!mounted) return;
        setConvos(res || []);
      })
      .catch(() => setConvos([]))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="w-96 h-full border-r bg-white flex flex-col shadow-sm">
      <div className="p-5 border-b bg-gradient-to-r from-[#0ea5a0] to-[#2563eb] text-white">
        <h2 className="text-2xl font-bold tracking-tight">Bazic Messages</h2>
        <p className="text-sm opacity-90 mt-1">{convos.length} conversation{convos.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-100 animate-pulse border border-gray-200" />
          ))
        ) : (
          convos.map((c) => {
            const active = pathname?.includes(`/messages/${c.userId}`);
            return (
              <Link
                key={c.userId}
                href={`/messages/${c.userId}`}
                className={`group flex items-center gap-4 p-3 rounded-xl border transition-all
                  ${active ? 'border-[#60a5fa] bg-[#eff6ff] shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="relative flex-shrink-0">
                  {c.avatar ? (
                    // if you store avatars, show them
                    <img src={c.avatar} alt={c.displayName} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563eb] to-[#0ea5a0] text-white flex items-center justify-center font-semibold text-lg shadow-md">
                      {c.displayName?.charAt(0) || 'U'}
                    </div>
                  )}

                  {c.isOnline && (
                    <Circle className="w-3 h-3 text-green-400 absolute -bottom-1 -right-1 fill-green-400" />
                  )}

                  {c.typing && !active && (
                    <div className="absolute -bottom-1 -left-1 bg-white px-2 py-0.5 rounded-full text-xs shadow-sm text-[#2563eb]">typing…</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate font-semibold ${active ? 'text-[#1e3a8a]' : 'text-gray-900'}`}>{c.displayName}</p>
                    <p className="text-xs text-gray-400">{c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                  <p className="truncate text-sm text-gray-500 mt-1">
                    {c.typing ? <span className="italic text-[#2563eb]">typing…</span> : (c.lastMessage || 'No messages yet')}
                  </p>
                </div>

                {c.unreadCount && c.unreadCount > 0 && (
                  <div className="min-w-[28px] text-center bg-[#ef4444] text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {c.unreadCount > 99 ? '99+' : c.unreadCount}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <Link
          href="/search"
          className="flex items-center justify-center gap-2 w-full py-2 bg-[#2563eb] hover:bg-[#1e40af] text-white rounded-xl shadow transition-all font-medium"
        >
          <User className="w-4 h-4" />
          Start New Chat
        </Link>
      </div>
    </aside>
  );
}
