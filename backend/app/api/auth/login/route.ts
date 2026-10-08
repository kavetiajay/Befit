import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || !password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check Supabase configuration
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, message: "Authentication service is not configured. Please check backend environment settings." },
        { status: 503 }
      );
    }

    // 3. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !authData?.user || !authData?.session) {
      let message = authError?.message || "Invalid email or password.";
      if (authError?.message?.includes("Email not confirmed")) {
        message = "Please confirm your email address before logging in.";
      } else if (
        authError?.message?.includes("Invalid login credentials") ||
        authError?.message?.includes("invalid_grant") ||
        authError?.message?.includes("invalid_credentials")
      ) {
        message = "Invalid email or password.";
      }

      return NextResponse.json(
        { success: false, message },
        { status: 401 }
      );
    }

    const { user, session } = authData;
    const client = supabaseAdmin || supabase;

    // 4. Fetch corresponding profile record from public.profiles
    const { data: profile } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "client";

    return NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            emailConfirmedAt: user.email_confirmed_at,
          },
          profile: profile || { id: user.id, email: user.email, role },
          role,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            expires_in: session.expires_in,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

