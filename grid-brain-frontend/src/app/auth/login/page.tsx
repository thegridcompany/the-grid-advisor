"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useCallback, useEffect } from "react";
import type React from "react";
import Image from 'next/image';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';

// Strategic operations array for typing effect
const GRID_OPERATIONS = [
  "Strategic Planning",
  "Business Intelligence", 
  "Revenue Optimization",
  "Market Analysis",
  "Performance Monitoring",
  "Decision Making",
  "Growth Acceleration",
  "Competitive Intelligence",
  "Financial Planning",
  "Operations Excellence",
  "Risk Assessment",
  "Resource Allocation"
];

// Custom hook for typing effect
function useTypingEffect(words: string[], typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const currentWord = words[currentWordIndex];

    if (isDeleting) {
      if (currentText === '') {
        // Finished deleting the current word, transition to typing the next word.
        // This is an immediate state change; the effect will re-run with the new state.
        setIsDeleting(false);
        setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
        // No timeout is set in this specific path as the state change triggers a re-evaluation.
      } else {
        // Still deleting the current word.
        timeoutId = setTimeout(() => {
          // Use words[currentWordIndex] to ensure it's from the correct current word,
          // and currentText.length from the closure (which is fine as currentText is a dependency).
          setCurrentText(words[currentWordIndex].substring(0, currentText.length - 1));
        }, deletingSpeed);
      }
    } else { // Not deleting (i.e., typing)
      if (currentText === currentWord) {
        // Finished typing the current word, pause then transition to deleting.
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      } else {
        // Still typing the current word, or starting to type a new word.
        // Add a slight delay for the first character of any word.
        const delay = (currentText === '') ? Math.max(typingSpeed, 100) : typingSpeed;
        timeoutId = setTimeout(() => {
          setCurrentText(words[currentWordIndex].substring(0, currentText.length + 1));
        }, delay);
      }
    }

    // Cleanup function to clear the timeout when the effect re-runs or the component unmounts.
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentWordIndex, currentText, isDeleting, words, typingSpeed, deletingSpeed, pauseTime]);

  return currentText;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  // Typing effect for dynamic claim
  const typedText = useTypingEffect(GRID_OPERATIONS, 80, 40, 1500);

  // Email validation helper
  const isValidEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.endsWith("@thegridcompany.it");
  }, []);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear errors when user starts typing
    if (error) {
      setError("");
    }
    
    // Reset success state if user changes email after successful send
    if (emailSent && newEmail !== email) {
      setEmailSent(false);
      setMessage("");
    }
  }, [email, error, emailSent]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    // Validate email format and domain
    if (!email.trim()) {
      setError("Inserisci il tuo indirizzo email aziendale.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError("Utilizza un indirizzo email valido @thegridcompany.it");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/magic-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Impossibile inviare il magic link.");
      }
      
      setEmailSent(true);
      setMessage(data.message || "Controlla la tua email per il magic link!");
    } catch (err: unknown) {
      console.error("Errore durante l'invio del magic link:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Si è verificato un errore imprevisto. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setMessage("");
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section with improved animation */}
        <div className="flex justify-center">
          <div className="logo-container w-20 h-20 md:w-24 md:h-24 transition-transform duration-300 hover:scale-105">
            <div className="shiny-image-effect">
              <Image
                src="/favicon_io/android-chrome-512x512.png"
                alt="Logo Grid Brain"
                fill
                style={{ objectFit: 'contain' }}
                priority
                className="drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm p-8 shadow-2xl border border-border/50 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-heading text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Grid Brain
            </h1>
            <div className="h-6 flex items-center justify-center">
              <p className="text-muted-foreground text-base font-medium">
                <span className="text-brandOrange">{typedText}</span>
                <span className="animate-pulse text-brandOrange ml-0.5">|</span>
              </p>
            </div>
          </div>

          {/* Success State */}
          {emailSent ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Email inviata!
                </h2>
                <p className="text-muted-foreground">
                  Abbiamo inviato un magic link a:
                </p>
                <p className="font-medium text-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  {email}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Controlla la tua casella di posta e clicca sul link per accedere.
                  Il link è valido per 15 minuti.
                </p>
                
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  className="w-full border-brandOrange/20 text-brandOrange hover:bg-brandOrange/10 hover:border-brandOrange/40"
                >
                  Invia nuovamente
                </Button>
              </div>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label 
                  htmlFor="email" 
                  className="text-foreground font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-brandOrange" />
                  Email Aziendale
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="nome.cognome@thegridcompany.it"
                    required
                    disabled={loading}
                    className={`transition-all duration-200 ${
                      error 
                        ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20" 
                        : "focus-visible:border-primary focus-visible:ring-primary/20"
                    }`}
                    autoComplete="email"
                    autoFocus
                  />
                  {email && isValidEmail(email) && !error && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                
                {/* Helper text */}
                <p className="text-xs text-muted-foreground">
                  Usa il tuo indirizzo email aziendale @thegridcompany.it
                </p>
              </div>

              <Button
                variant="brand"
                type="submit"
                className="w-full h-11 font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2 text-white" />
                    Invia Magic Link
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Status Messages */}
          {message && !emailSent && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            The Grid Company ® {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}