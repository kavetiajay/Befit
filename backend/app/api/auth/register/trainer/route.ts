import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/client";

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      trainerAccessCode,
      phone,
      dob,
      gender,
      address,
      emergencyContact,
    } = body;

    // 1. Validate required fields
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 }
      );
    }
    if (!trainerAccessCode || typeof trainerAccessCode !== "string") {
      return NextResponse.json(
        { success: false, message: "Trainer access code is required." },
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

    // 2. Validate trainer access code to prevent unauthorized trainer registration
    const trainerSecret = process.env.TRAINER_REGISTRATION_SECRET || "befit_trainer_2026";
    if (trainerAccessCode !== trainerSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid trainer access code." },
        { status: 403 }
      );
    }

    // 3. Verify server-side Supabase Admin client configuration
    if (!supabaseAdmin) {
      console.error("Trainer registration failed: Server-side SUPABASE_SECRET_KEY is not configured.");
      return NextResponse.json(
        {
          success: false,
          message: "Database configuration error: Server-side admin credentials are not configured. Please ensure SUPABASE_SECRET_KEY is set in your environment.",
        },
        { status: 503 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 4. Create the Auth user using the server-side Supabase Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: "trainer",
        full_name: fullName.trim(),
      },
    });

    if (authError || !authData?.user) {
      const authErrMsg = authError?.message || "Failed to create authentication user.";
      console.error("Supabase Admin Auth user creation error for trainer:", authErrMsg);

      if (
        authErrMsg.toLowerCase().includes("already registered") ||
        authErrMsg.toLowerCase().includes("already exists") ||
        authErrMsg.toLowerCase().includes("unique")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this email address already exists. Please log in instead.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, message: authErrMsg },
        { status: authError?.status || 400 }
      );
    }

    const authUser = authData.user;
    createdAuthUserId = authUser.id;

    // 5. Create corresponding public.profiles record with role 'trainer'
    const profilePayload = {
      id: createdAuthUserId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role: "trainer",
      phone: phone || null,
      dob: dob || null,
      gender: gender || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Profile synchronization failed for trainer:", profileError.message);

      // Rollback Auth user if profile creation fails to prevent orphan account
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        console.log(`Successfully rolled back Auth user ${createdAuthUserId} after profile creation failure.`);
      } catch (rollbackErr) {
        console.error("Failed to delete orphaned Auth user on rollback:", rollbackErr);
      }

      return NextResponse.json(
        { success: false, message: "User account created but profile synchronization failed: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Trainer registered successfully.",
        data: {
          user: {
            id: createdAuthUserId,
            email: authUser.email,
            fullName: fullName.trim(),
            role: "trainer",
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Trainer registration exception caught:", error);

    // Rollback orphaned Auth user if an unexpected exception occurred after creation
    if (createdAuthUserId && supabaseAdmin) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        console.log(`Rollback completed for Auth user ${createdAuthUserId} after exception.`);
      } catch (rollbackErr) {
        console.error("Rollback failed during exception handling:", rollbackErr);
      }
    }

    return NextResponse.json(
      { success: false, message: "An unexpected server error occurred: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

