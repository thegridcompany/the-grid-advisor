'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has a token
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      // User is authenticated, redirect to dashboard
      router.replace('/dashboard');
    } else {
      // User is not authenticated, redirect to login
      router.replace('/auth/login');
    }
  }, [router]);

  // Show loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brandOrange" />
    </div>
  );
} 