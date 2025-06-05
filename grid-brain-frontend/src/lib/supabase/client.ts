import { createBrowserClient } from "@supabase/ssr";

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// It's highly recommended to use environment variables for these
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  console.warn(
    "Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL environment variable."
  );
}
if (!supabaseAnonKey) {
  console.warn(
    "Supabase Anon Key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable."
  );
}

export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// This can be used directly in client components
export const supabase = createSupabaseBrowserClient();
