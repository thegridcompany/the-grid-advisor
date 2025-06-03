"use client";

import React, { useEffect } from 'react';
import { useAuthStore, UserRole } from '@/store/authStore';
import { useRouter } from 'next/navigation'; // Using Next.js 13+ App Router navigation

interface WithAuthProps {
  allowedRoles?: UserRole[];
}

export default function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: WithAuthProps
) {
  const WithAuthComponent = (props: P) => {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading); // To show a loading state
    const loadUserFromToken = useAuthStore((state) => state.loadUserFromToken);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
      if (!token && !isLoading) {
        // If there was no token to begin with (e.g. after logout or fresh visit)
        // and we are not already loading user (which implies a token might be there)
        router.replace('/login'); // Or your login page route
      } else if (token && !user && !isLoading) {
        // Token exists, but user is not loaded, and not currently loading.
        // This can happen on initial load if loadUserFromToken hasn't finished or failed.
        // We attempt to load user, if it fails, the store will clear token/user, triggering redirect.
        loadUserFromToken();
      }
    }, [token, user, isLoading, loadUserFromToken, router]);

    useEffect(() => {
      if (!isLoading && user) { // Only check roles once user is loaded and not loading
        if (!isAuthenticated) {
          router.replace('/login');
        } else if (options?.allowedRoles && options.allowedRoles.length > 0) {
          const userRole = user?.role as UserRole; // Cast assuming user.role matches UserRole enum
          if (!options.allowedRoles.includes(userRole)) {
            router.replace('/unauthorized'); // Or a generic 403 page
          }
        }
      }
    }, [isAuthenticated, user, isLoading, router, options?.allowedRoles]);

    // Show loading indicator while checking auth state or loading user
    if (isLoading || (!user && token)) { 
      // Still loading if there's a token but no user object yet, or store explicitly says isLoading
      return <div>Loading...</div>; // Replace with a proper loading spinner/component
    }

    // If authenticated and (no roles specified or user has allowed role)
    if (isAuthenticated && user) {
      if (!options?.allowedRoles || options.allowedRoles.length === 0) {
        return <WrappedComponent {...props} />;
      }
      const userRole = user?.role as UserRole;
      if (options.allowedRoles.includes(userRole)) {
        return <WrappedComponent {...props} />;
      }
    }

    // Fallback, should be handled by redirects in useEffect, but good for safety.
    // Or, if not loading and not authenticated, useEffect should have redirected.
    // This might briefly show before redirect or if logic in useEffect is bypassed.
    return null; // Or a loading spinner, or redirect again if somehow missed.
  };

  WithAuthComponent.displayName = `WithAuth(${(WrappedComponent.displayName || WrappedComponent.name || 'Component')})`;

  return WithAuthComponent;
}

// Example Usage:
// const ProtectedDashboardPage = withAuth(DashboardPage, { allowedRoles: [UserRole.ADMIN] });
// export default ProtectedDashboardPage; 