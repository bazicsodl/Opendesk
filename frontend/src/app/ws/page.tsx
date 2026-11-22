'use client';
import { useEffect } from 'react';
import { API_BASE } from '../../lib/api';
import { getToken } from '../../lib/auth';

export default function WS() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const url = `${API_BASE.replace(/^http/, 'ws')}/ws/notifications?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    ws.onopen = () => console.log('ws open');
    ws.onmessage = (m) => console.log('ws msg', m.data);
    ws.onclose = () => console.log('ws closed');
    return () => ws.close();
  }, []);

  return <div>WebSocket notifications test page. Check browser console.</div>;
}
