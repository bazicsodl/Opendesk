'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, clearAuth, getToken } from '../lib/auth';
import { connectNotifications, onNotification } from '../lib/notifications-socket';
import { API_BASE, apiFetch } from '../lib/api';
import { useEffect, useRef, useState } from 'react';
import { Home, FilePlus, Briefcase, MessageSquare, Bell, LogOut, User as UserIcon, Search, Settings, ChevronDown } from 'lucide-react';

export default function Nav() {
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string>('/default-avatar.svg');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function logout() {
    clearAuth();
    setUser(null);
    router.push('/auth/login');
  }

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    async function init() {
      const token = typeof window !== 'undefined' ? getToken() : null;
      if (!token) return;

      try {
        connectNotifications(token);
      } catch {}

      try {
        const [notifRes, msgRes, me] = await Promise.all([
          fetch(`${API_BASE}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/messages/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
          apiFetch('/profile/me').catch(() => null),
        ]);
        if (!mounted) return;
        if (notifRes.ok) {
          const data = await notifRes.json();
          setUnreadNotifications(Number(data.count || 0));
        }
        if (msgRes.ok) {
          const data = await msgRes.json();
          setUnreadMessages(Number(data.count || 0));
        }
        if (me?.imageUrl) setAvatar(me.imageUrl);
      } catch {}

      unsub = onNotification(() => {
        setUnreadNotifications((prev) => prev + 1);
      });
    }

    init();
    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={`nav-shell sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'glass backdrop-blur-md shadow-lg' : 'nav-idle backdrop-blur-sm shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 theme-gradient-brand rounded-xl flex items-center justify-center theme-shadow-brand transition-all duration-300">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="font-bold text-2xl text-gradient">Opendesk</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className={`nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}><Home className="w-5 h-5" /><span className="font-medium">Feed</span></Link>
            <Link href="/posts/new" className={`nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/posts/new') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}><FilePlus className="w-5 h-5" /><span className="font-medium">Post</span></Link>
            <Link href="/search" className={`nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/search') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}><Search className="w-5 h-5" /><span className="font-medium">Search</span></Link>
            <Link href="/jobs" className={`nav-link flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/jobs') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}><Briefcase className="w-5 h-5" /><span className="font-medium">Jobs</span></Link>
            <Link href="/messages" className={`nav-link relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/messages') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}>
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Messages</span>
              {unreadMessages > 0 ? <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">{unreadMessages}</span> : null}
            </Link>
            <Link href="/notifications" className={`nav-link relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${isActive('/notifications') ? 'bg-gradient-to-r from-emerald-50 to-amber-50 text-emerald-800 shadow-inner' : 'text-gray-700 hover:text-emerald-800 hover:bg-gray-50/50 hover:shadow-md'}`}>
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notifications</span>
              {unreadNotifications > 0 ? <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">{unreadNotifications}</span> : null}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((s) => !s)} className="nav-menu-button flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1 py-1 hover:shadow-md">
                  <img src={avatar || '/default-avatar.svg'} alt="profile" className="h-9 w-9 rounded-full object-cover" />
                  <ChevronDown className="h-4 w-4 text-slate-500 mr-1" />
                </button>
                {menuOpen ? (
                  <div className="nav-menu-panel absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <Link onClick={() => setMenuOpen(false)} href="/profile/me" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><UserIcon className="w-4 h-4" /> View Profile</Link>
                    <Link onClick={() => setMenuOpen(false)} href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Settings className="w-4 h-4" /> Settings</Link>
                    <button onClick={logout} className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"><LogOut className="w-4 h-4" /> Logout</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/auth/login" className="px-5 py-2.5 theme-gradient-brand text-white rounded-xl theme-gradient-brand-hover transition-all duration-300 hover:shadow-lg theme-shadow-brand-hover flex items-center gap-2 hover:-translate-y-0.5">
                <UserIcon className="w-5 h-5" />
                <span className="font-medium">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="nav-mobile md:hidden border-t border-gray-100/50 bg-white/95 backdrop-blur-sm">
        <div className="flex justify-around items-center h-14">
          <Link href="/" className="flex flex-col items-center justify-center p-2 group"><div className={`p-2 rounded-lg transition-all duration-300 ${isActive('/') ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 group-hover:text-emerald-800'}`}><Home className="w-5 h-5" /></div><span className={`text-xs mt-1 ${isActive('/') ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>Feed</span></Link>
          <Link href="/search" className="flex flex-col items-center justify-center p-2 group"><div className={`p-2 rounded-lg transition-all duration-300 ${isActive('/search') ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 group-hover:text-emerald-800'}`}><Search className="w-5 h-5" /></div><span className={`text-xs mt-1 ${isActive('/search') ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>Search</span></Link>
          <Link href="/messages" className="relative flex flex-col items-center justify-center p-2 group"><div className={`p-2 rounded-lg transition-all duration-300 ${isActive('/messages') ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 group-hover:text-emerald-800'}`}><MessageSquare className="w-5 h-5" /></div><span className={`text-xs mt-1 ${isActive('/messages') ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>Messages</span>{unreadMessages > 0 ? <span className="absolute top-1 right-2 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">{unreadMessages}</span> : null}</Link>
          <Link href="/notifications" className="relative flex flex-col items-center justify-center p-2 group"><div className={`p-2 rounded-lg transition-all duration-300 ${isActive('/notifications') ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 group-hover:text-emerald-800'}`}><Bell className="w-5 h-5" /></div><span className={`text-xs mt-1 ${isActive('/notifications') ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>Notifications</span>{unreadNotifications > 0 ? <span className="absolute top-1 right-2 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">{unreadNotifications}</span> : null}</Link>
          <Link href="/profile/me" className="flex flex-col items-center justify-center p-2 group"><div className={`p-2 rounded-lg transition-all duration-300 ${isActive('/profile/me') ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 group-hover:text-emerald-800'}`}><UserIcon className="w-5 h-5" /></div><span className={`text-xs mt-1 ${isActive('/profile/me') ? 'text-emerald-800 font-medium' : 'text-gray-500'}`}>Profile</span></Link>
        </div>
      </div>
    </nav>
  );
}
