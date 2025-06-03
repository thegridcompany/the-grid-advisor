"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, UserRole } from '@/store/authStore'; // Import UserRole and store
// import { useRouter } from 'next/navigation';

// Assuming UserRole enum is available or will be fetched/defined
// For now, let's define a placeholder or import if available from a shared types location
// enum UserRole { << REMOVE THIS PLACEHOLDER
//   CONSULTANT_PO = "consultant_po",
//   DEVELOPER = "developer",
//   TECH_LEAD = "tech_lead",
//   PARTNER_CFO = "partner_cfo",
//   CLIENT = "client",
// }

export function RegistrationForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT); // Default role
  // const router = useRouter(); // For redirecting

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError(); // Clear previous errors

    if (password !== confirmPassword) {
      // This specific error can be handled locally or by setting it in the store
      // For now, local state is fine, but store could have a generic setError action.
      // For now, let's assume store.setError can be used or we handle it locally.
      // For simplicity, I will use the existing error state from the store if register fails.
      // The store.setError from loginForm was specific to that component's local state error.
      // We can make a more generic setError in store if needed. For now, register will set its own errors.
      useAuthStore.setState({ error: "Passwords do not match." });
      return;
    }
    
    try {
      await register({ username, email, password, role });
      // Handle successful registration, e.g., show message, redirect to login
      // router.push('/login?registered=true');
      console.log("Registration successful!");
      // Optionally, clear form fields here
    } catch (err: unknown) {
      // Error is already set in the store by the register action
      console.error("Registration failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-center">Register</h2>
      
      <div className="space-y-1">
        <Label htmlFor="username">Username</Label>
        <Input 
          id="username" 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="yourusername"
          required 
          disabled={isLoading}
        />
      </div>

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
          minLength={8}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          placeholder="••••••••"
          required 
          minLength={8}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <select 
          id="role" 
          value={role} 
          onChange={(e) => setRole(e.target.value as UserRole)}
          required
          disabled={isLoading}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {Object.values(UserRole).map(roleValue => (
            <option key={roleValue} value={roleValue}>
              {roleValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {/* Format for display */}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </Button>

      {/* <div className="text-sm text-center">
        <p>Already have an account? <a href="/login" className="text-primary hover:underline">Login here</a></p>
      </div> */}
    </form>
  );
} 