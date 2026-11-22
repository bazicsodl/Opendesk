// Simple wrapper that redirects to /auth if not logged in
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../lib/auth';


export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) router.push('/auth/login');
  }, [router]);
  return <>{children}</>;
}
