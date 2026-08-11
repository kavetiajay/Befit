import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

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

    // 2. Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      // Safe error messages for typical auth failures
      let message = "Invalid email or password.";
      if (authError.message.includes("Email not confirmed")) {
        message = "Please confirm your email address before logging in.";
      }
      return NextResponse.json(
        { success: false, message },
        { status: 401 }
      );
    }

    const { user, session } = authData;
    if (!user || !session) {
      return NextResponse.json(
        { success: false, message: "Authentication failed. No session returned." },
        { status: 500 }
      );
    }

    // 3. Fetch corresponding profile record
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(`Profile not found for authenticated user ${user.id}:`, profileError);
      return NextResponse.json(
        { success: false, message: "User authenticated but user profile does not exist." },
        { status: 404 }
      );
    }

    // 4. Return success response with user + profile + role + session token
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
          profile,
          role: profile.role,
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
