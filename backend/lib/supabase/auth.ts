import { createClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { supabase } from "./client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Creates a stateless, request-specific Supabase client using the user's JWT access token.
 * This is thread-safe and prevents session leakage between concurrent server-side requests.
 */
export function getRequestClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface AuthUserInfo {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  role: string;
}

/**
 * Helper to retrieve and verify the authenticated user from the Request's Authorization header.
 * Returns null if authentication is missing, expired, or invalid.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthUserInfo | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return null;
    }

    // Verify token and get user using Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return null;
    }

    // Fetch the user's profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      user,
      profile,
      role: profile.role,
    };
  } catch (err) {
    console.error("Authentication helper error:", err);
    return null;
  }
}

/**
 * Check if the current requester is an authenticated Trainer
 */
export async function isTrainer(request: Request): Promise<boolean> {
  const authInfo = await getAuthenticatedUser(request);
  return authInfo?.role === "trainer";
}

/**
 * Check if the current requester is an authenticated Client
 */
export async function isClient(request: Request): Promise<boolean> {
  const authInfo = await getAuthenticatedUser(request);
  return authInfo?.role === "client";
}

/**
 * Verifies that a user is authenticated, otherwise returns a 401 NextResponse.
 */
export async function requireAuthenticatedUser(request: Request): Promise<AuthUserInfo | NextResponse> {
  const authInfo = await getAuthenticatedUser(request);
  if (!authInfo) {
    return NextResponse.json(
      { success: false, message: "Unauthenticated. Please log in." },
      { status: 401 }
    );
  }
  return authInfo;
}

/**
 * Verifies that a user is authenticated and has the required role, otherwise returns 401/403 NextResponse.
 */
export async function requireRole(request: Request, allowedRole: string): Promise<AuthUserInfo | NextResponse> {
  const authInfo = await requireAuthenticatedUser(request);
  if (authInfo instanceof NextResponse) {
    return authInfo;
  }
  if (authInfo.role !== allowedRole) {
    return NextResponse.json(
      { success: false, message: "Forbidden. Access is denied." },
      { status: 403 }
    );
  }
  return authInfo;
}

/**
 * Require a Trainer role.
 */
export async function requireTrainer(request: Request): Promise<AuthUserInfo | NextResponse> {
  return requireRole(request, "trainer");
}

/**
 * Require a Client role.
 */
export async function requireClient(request: Request): Promise<AuthUserInfo | NextResponse> {
  return requireRole(request, "client");
}

/**
 * Verifies if a client is assigned to a trainer.
 */
export async function isAssignedClient(trainerId: string, clientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("trainer_client")
    .select("id")
    .eq("trainer_id", trainerId)
    .eq("client_id", clientId)
    .single();
  return !error && data !== null;
}
