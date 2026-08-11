import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

export async function POST(request: Request) {
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

    // 3. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: authError.status || 400 }
      );
    }

    const authUser = authData.user;
    if (!authUser || !authUser.id) {
      return NextResponse.json(
        { success: false, message: "Failed to create user in authentication system." },
        { status: 500 }
      );
    }

    const userId = authUser.id;

    // 4. Create public.profiles record with role 'trainer'
    const profilePayload = {
      id: userId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: "trainer",
      phone: phone || null,
      dob: dob || null,
      gender: gender || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
    };

    // Use admin client if available to bypass RLS restrictions (e.g. if email confirmation is pending
    // and because normal users cannot self-register as 'trainer' under default RLS insert policies)
    const clientToUse = supabaseAdmin || supabase;
    const { error: profileError } = await clientToUse
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Profile synchronization failed for trainer:", profileError);

      // Rollback Auth user if profile creation fails to prevent inconsistent data
      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          console.log(`Successfully rolled back Auth user ${userId} after profile failure.`);
        } catch (rollbackErr) {
          console.error("Failed to delete orphaned Auth user on rollback:", rollbackErr);
        }
      }

      return NextResponse.json(
        { success: false, message: "User created but profile synchronization failed: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Trainer registered successfully.",
        data: {
          user: {
            id: userId,
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
    return NextResponse.json(
      { success: false, message: "An unexpected server error occurred: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
