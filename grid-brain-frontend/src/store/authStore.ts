import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define the User type based on backend UserResponse or similar
// This should ideally be imported from a shared types location
interface User {
  id: string; // Assuming UUID is string on frontend
  username: string;
  email: string;
  role: string; // Or a UserRole enum if defined on frontend
  is_active: boolean;
  first_name?: string | null;
  last_name?: string | null;
}

// Define UserRole enum for frontend usage (matches backend)
export enum UserRole {
  CONSULTANT_PO = "consultant_po",
  DEVELOPER = "developer",
  TECH_LEAD = "tech_lead",
  PARTNER_CFO = "partner_cfo",
  CLIENT = "client",
}

interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  first_name?: string | null;
  last_name?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: () => boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (userData: UserRegistrationData) => Promise<void>; // Changed any to UserRegistrationData
  logout: () => void;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
  loadUserFromToken: () => Promise<void>; // For loading user on app start if token exists
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"; // Adjust as needed

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      isAuthenticated: () => !!get().token && !!get().user,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),

      login: async (emailOrUsername, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailOrUsername, password }), // Assuming login with email
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || "Login failed");
          }
          set({
            user: data.user_info,
            token: data.access_token,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          set({
            error: errorMessage,
            isLoading: false,
            user: null,
            token: null,
          });
          throw error; // Re-throw for the component to handle
        }
      },

      register: async (userData) => {
        // userData: { username, email, password, role, ...}
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || "Registration failed");
          }
          // Optionally log in the user directly or set user data if returned
          // For now, registration success doesn't automatically log in
          set({ isLoading: false });
          // Potentially set user if register endpoint returns full user data:
          // set({ user: data, isLoading: false });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          set({ error: errorMessage, isLoading: false });
          throw error; // Re-throw for the component to handle
        }
      },

      logout: () => {
        // Optionally call a backend logout endpoint if it exists (e.g., for token blocklisting)
        set({ user: null, token: null, error: null });
      },

      loadUserFromToken: async () => {
        const token = get().token;
        if (!token) return;
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to fetch user");
          }
          const userData = await response.json();
          set({ user: userData, isLoading: false, error: null });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          set({
            user: null,
            token: null,
            isLoading: false,
            error: errorMessage,
          });
        }
      },
    }),
    {
      name: "auth-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ token: state.token }), // Only persist the token
    }
  )
);

// Call loadUserFromToken when the store is initialized and token exists from storage
if (typeof window !== "undefined") {
  let initialToken: string | null = null;
  try {
    const storedAuthState = localStorage.getItem("auth-storage");
    if (storedAuthState) {
      initialToken = JSON.parse(storedAuthState)?.state?.token || null;
    }
  } catch (e) {
    console.error("Failed to parse auth-storage from localStorage", e);
    // Optionally clear corrupted storage: localStorage.removeItem('auth-storage');
  }

  if (initialToken) {
    // Set token first so loadUserFromToken can use it via get()
    useAuthStore.setState({ token: initialToken });
    useAuthStore.getState().loadUserFromToken();
  }
}
