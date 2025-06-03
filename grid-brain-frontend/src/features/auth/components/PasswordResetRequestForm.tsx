"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      console.log('Requesting password reset for:', email);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      // Assume API call is successful for now
      setSuccessMessage('If an account with this email exists, password reset instructions have been sent.');
      setEmail(''); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to send reset instructions. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-center">Reset Password</h2>
      
      {successMessage ? (
        <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground text-center">Enter your email address and we&apos;ll send you a link to reset your password.</p>
          <div className="space-y-1">
            <Label htmlFor="email-reset">Email Address</Label>
            <Input 
              id="email-reset" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              required 
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </>
      )}
      <div className="text-sm text-center">
        {/* Ensure this link points to your actual login page route */}
        <a href="/login" className="text-primary hover:underline">Back to Login</a>
      </div>
    </form>
  );
} 