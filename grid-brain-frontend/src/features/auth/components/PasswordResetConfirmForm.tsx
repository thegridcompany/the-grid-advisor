"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation'; // For getting token from URL

export function PasswordResetConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("No reset token found. Please request a new reset link.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
        setError("Reset token is missing. Please try the link from your email again.");
        return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to reset password
      console.log('Attempting to reset password with token:', token, 'and new password.');
      // const response = await fetch('/api/auth/reset-password', { 
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token, newPassword })
      // });
      // if (!response.ok) { throw new Error('Failed to reset password.'); }
      // const data = await response.json();

      // Simulate API call delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Your password has been reset successfully! You can now login with your new password.');
      // Optionally redirect to login page after a delay
      setTimeout(() => router.push('/login'), 3000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to reset password. The link may be invalid or expired.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return <p className="text-center p-4">Validating reset link...</p>; // Or a spinner
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm max-w-sm mx-auto">
      <h2 className="text-2xl font-semibold text-center">Set New Password</h2>
      
      {successMessage ? (
        <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
      ) : (
        <>
          {!token && error && (
             <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {token && (
            <>
                <div className="space-y-1">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                    minLength={8}
                    disabled={isLoading}
                    />
                </div>

                <div className="space-y-1">
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input 
                    id="confirmNewPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    required 
                    minLength={8}
                    disabled={isLoading}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || !token}>
                    {isLoading ? 'Resetting Password...' : 'Set New Password'}
                </Button>
            </>
          )}
        </>
      )}
       {successMessage && (
         <div className="text-sm text-center mt-4">
            <a href="/login" className="text-primary hover:underline">Proceed to Login</a>
        </div>
       )}
    </form>
  );
} 