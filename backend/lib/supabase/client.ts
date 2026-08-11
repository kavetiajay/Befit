import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if credentials are using the default placeholder strings or are missing
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "your_supabase_project_url" && 
  supabaseAnonKey !== "your_supabase_publishable_key" &&
  supabaseUrl.startsWith("https://");

if (!isConfigured) {
  console.warn(
    "⚠️ [Supabase Client Warning]: Supabase credentials are not fully configured or are still using default placeholders in your .env file."
  );
}

// Initialize and export the Supabase client.
// If not configured, we pass fallback placeholder strings to prevent Next.js from crashing on boot,
// allowing us to return a friendly error message when the test endpoint is hit.
export const supabase = createClient(
  isConfigured ? supabaseUrl! : "https://placeholder-project.supabase.co",
  isConfigured ? supabaseAnonKey! : "placeholder-anon-key"
);

// Initialize admin client if service key is provided
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey && isConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Export helper to verify if the client has real configuration loaded
export function isSupabaseConfigured(): boolean {
  return !!isConfigured;
}
