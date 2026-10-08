import { createClient } from "@supabase/supabase-js";

// Multi-alias environment variable resolution
const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const rawAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

const rawSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

export const supabaseUrl = rawUrl?.trim();
export const supabaseAnonKey = rawAnonKey?.trim();
export const supabaseSecretKey = rawSecretKey?.trim();

// Validation flags
const hasValidUrl = Boolean(
  supabaseUrl &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseUrl.startsWith("https://")
);

const hasValidAnonKey = Boolean(
  supabaseAnonKey &&
  supabaseAnonKey !== "your_supabase_publishable_key" &&
  supabaseAnonKey !== "your_supabase_anon_key"
);

const hasValidSecretKey = Boolean(
  supabaseSecretKey &&
  supabaseSecretKey !== "your_supabase_secret_key"
);

// Effective client key: prefer anon/publishable key, fallback to service secret key if available
const effectiveAuthKey = hasValidAnonKey
  ? supabaseAnonKey!
  : (hasValidSecretKey ? supabaseSecretKey! : "placeholder-anon-key");

// When a valid URL is provided, always use it rather than falling back to placeholder domain
const effectiveUrl = hasValidUrl
  ? supabaseUrl!
  : "https://placeholder-project.supabase.co";

// Public / Standard client
export const supabase = createClient(effectiveUrl, effectiveAuthKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Admin / Service Role client (privileged server-side operations)
export const supabaseAdmin = hasValidUrl && hasValidSecretKey
  ? createClient(supabaseUrl!, supabaseSecretKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Export helper to verify if the client has real configuration loaded
export function isSupabaseConfigured(): boolean {
  return Boolean(hasValidUrl && (hasValidAnonKey || hasValidSecretKey));
}


