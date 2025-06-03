"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your magic link...");

  useEffect(() => {
    if (!token) {
      setMessage("Magic link token is missing. Please try logging in again.");
      setStatus("error");
      // Redirect to login after a short delay to allow user to read message
      setTimeout(() => {
        router.replace("/auth/login?error=TokenMissing");
      }, 3000);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify`, { // Corrected backend verification endpoint
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || data.message || "Failed to verify magic link.");
        }

        // Backend should set an HTTPOnly session cookie upon successful verification.
        // The frontend doesn't need to handle the session token directly.
        setMessage(data.message || "Successfully verified! Redirecting...");
        setStatus("success");
        
        // Redirect to the main application page after successful verification
        // You might want to redirect to a specific dashboard or user home page
        setTimeout(() => {
          router.replace("/"); // Or your desired redirect path e.g., /dashboard
        }, 1500);

      } catch (err: unknown) {
        console.error("Error verifying magic link:", err);
        if (err instanceof Error) {
          setMessage(err.message);
        } else {
          setMessage("An unexpected error occurred during verification.");
        }
        setStatus("error");
        // Redirect to login after a short delay
        setTimeout(() => {
          router.replace(`/auth/login?error=VerificationFailed&message=${encodeURIComponent(message)}`);
        }, 3000);
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-card p-8 shadow-xl">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brandOrange" />
            <h1 className="text-2xl font-semibold text-foreground">Verifying...</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-semibold text-green-500">Verification Successful!</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-semibold text-red-500">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => router.replace("/auth/login")}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-brandOrange px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-brandOrange/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Back to Login
            </button>
          </>
        )}
         <p className="text-center text-xs text-muted-foreground pt-6">
            The Grid Company ® {new Date().getFullYear()}
          </p>
      </div>
    </div>
  );
} 