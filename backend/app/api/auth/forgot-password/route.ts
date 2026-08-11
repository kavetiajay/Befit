import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // 1. Validate email input
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Invalid email format." },
        { status: 400 }
      );
    }

    // 2. Set redirect URL if origin header exists (e.g. for dynamic deployment environments)
    const origin = request.headers.get("origin");
    // Vite frontend typically runs hash-based routing. Let's redirect to standard /#/reset-password
    const redirectTo = origin ? `${origin}/#/reset-password` : undefined;

    // 3. Trigger password recovery email in Supabase
    // Note: To prevent user enumeration, we do not throw errors or reveal user existence status.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );

    if (resetError) {
      console.warn("Supabase resetPasswordForEmail warning:", resetError.message);
      // If it is a rate limit or another global error, we can log it, but we still return success to prevent user enumeration
    }

    return NextResponse.json(
      {
        success: true,
        message: "If an account exists for this email, password reset instructions have been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
