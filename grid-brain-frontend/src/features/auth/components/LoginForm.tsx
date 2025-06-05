"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore'; // Import the auth store
// Assuming a router hook for navigation, e.g., from Next.js
// import { useRouter } from 'next/navigation'; 

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const router = useRouter(); // For redirecting after login

  // Get actions and state from the store
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError); // To clear previous errors

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError(); // Clear previous errors before new attempt
    try {
      await login(email, password);
      // Handle successful login, e.g., redirect to dashboard
      // router.push('/dashboard'); 
      console.log("Login successful, redirecting...");
    } catch (err: unknown) {
      // Error is already set in the store by the login action
      console.error("Login failed:", err);
      // No need to setError here as the store handles it
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-center">Login</h2>
      
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="you@example.com"
          required 
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="••••••••"
          required 
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>

      {/* Optional: Add links for registration or password reset */}
      {/* <div className="text-sm text-center">
        <p>Don't have an account? <a href="/register" className="text-primary hover:underline">Register here</a></p>
        <p><a href="/forgot-password" className="text-primary hover:underline">Forgot password?</a></p>
      </div> */}
    </form>
  );
} 