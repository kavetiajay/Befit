import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
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

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Invalid email format." },
        { status: 400 }
      );
    }

    // 2. Create the user in Supabase Auth
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

    // 3. Create public.profiles record
    const profilePayload = {
      id: userId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: "client",
      phone: phone || null,
      dob: dob || null,
      gender: gender || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
    };

    // Use admin client if available to bypass RLS restrictions (e.g. if email confirmation is pending)
    const clientToUse = supabaseAdmin || supabase;
    const { error: profileError } = await clientToUse
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Profile synchronization failed:", profileError);

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
        message: "Client registered successfully.",
        data: {
          user: {
            id: userId,
            email: authUser.email,
            fullName: fullName.trim(),
            role: "client",
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Client registration exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected server error occurred: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
