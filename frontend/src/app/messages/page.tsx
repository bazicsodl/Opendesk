'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { MessageSquare, User, Clock, Check } from 'lucide-react';
import { clearAuth, getToken } from '@/lib/auth';

export default function Conversations() {
  const router = useRouter();
  const [convos, setConvos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!getToken()) {
      clearAuth();
      router.replace('/auth/login');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiFetch('/messages/conversations')
      .then(setConvos)
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.startsWith("401")) {
          clearAuth();
          router.replace('/auth/login');
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="w-full py-6 px-0 sm:px-2">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full py-6 px-0 sm:px-2">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Your conversations</p>
          </div>
          <div className="text-sm text-gray-500">
            {convos.length} conversation{convos.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      {convos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6">Start a conversation by messaging someone</p>
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <User className="w-4 h-4" />
            Find people to message
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {convos.map(c => (
            <Link
              key={c.id || c.userId || `${c.userId}-${c.lastMessageTime}`}

              href={`/messages/${c.userId}`}
              className="block p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-emerald-200 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-700 to-amber-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {c.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  {c.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {c.unreadCount}
                    </div>
                  )}
                  {c.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {c.displayName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {c.lastMessageTime || 'Recently'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {c.lastMessage && (
                      <>
                        <div className={`truncate text-gray-600 flex-1 ${
                          c.unreadCount > 0 ? 'font-medium' : ''
                        }`}>
                          {c.lastMessage}
                        </div>
                        {c.isRead && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="text-gray-400 group-hover:text-emerald-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
