import type { ReactNode } from 'react';
import ChatSidebar from '../../components/ChatSidebar';

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
     
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
