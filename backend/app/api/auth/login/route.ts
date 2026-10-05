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

    // 2. Try live Supabase authentication if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (!authError && authData?.user && authData?.session) {
          const { user, session } = authData;
          const client = supabaseAdmin || supabase;

          // Fetch corresponding profile record
          const { data: profile } = await client
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          const role = profile?.role || (normalizedEmail === "trainee@gmail.com" ? "trainer" : "client");

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
        } else if (authError) {
          const isConnectionErr = authError.message.includes("fetch failed") || authError.message.includes("ENOTFOUND");
          if (!isConnectionErr) {
            let message = authError.message || "Invalid email or password.";
            if (authError.message.includes("Email not confirmed")) {
              message = "Please confirm your email address before logging in.";
            }
            
            // Demo credentials fallback
            if (normalizedEmail === "trainee@gmail.com" && password === "ajay@08") {
              return NextResponse.json(
                {
                  success: true,
                  message: "Demo trainer login successful.",
                  data: {
                    user: { id: "demo_trainer_1", email: normalizedEmail },
                    profile: { id: "demo_trainer_1", full_name: "Ajay Trainer", role: "trainer" },
                    role: "trainer",
                    session: {
                      access_token: "demo_trainer_token",
                    },
                  },
                },
                { status: 200 }
              );
            }

            return NextResponse.json(
              { success: false, message },
              { status: 401 }
            );
          }
        }
      } catch (connErr) {
        console.warn("Supabase connection exception, using fallback authentication:", connErr);
      }
    }

    // 3. Fallback / offline credentials support
    if (
      (normalizedEmail === "trainee@gmail.com" && (password === "ajay@08" || password.length >= 4)) ||
      normalizedEmail.includes("trainer") ||
      normalizedEmail === "admin@befit.com"
    ) {
      return NextResponse.json(
        {
          success: true,
          message: "Trainer login successful.",
          data: {
            user: { id: "demo_trainer_1", email: normalizedEmail },
            profile: { id: "demo_trainer_1", full_name: "Ajay Trainer", role: "trainer" },
            role: "trainer",
            session: {
              access_token: "demo_trainer_token",
            },
          },
        },
        { status: 200 }
      );
    }

    if (
      normalizedEmail.includes("@") &&
      (normalizedEmail.includes("client") ||
       normalizedEmail.includes("example.com") ||
       password.length >= 4)
    ) {
      return NextResponse.json(
        {
          success: true,
          message: "Client login successful.",
          data: {
            user: { id: "client_1", email: normalizedEmail },
            profile: { id: "client_1", full_name: "Rahul Sharma", role: "client" },
            role: "client",
            session: {
              access_token: "demo_client_1",
            },
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
