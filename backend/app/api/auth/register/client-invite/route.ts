import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

// Input validation schema using Zod
const clientInviteRegisterSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(32, { message: "Invalid invitation token format." })
      .max(128, { message: "Invalid invitation token format." }),
    full_name: z
      .string()
      .trim()
      .min(1, { message: "Full name is required." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirm_password: z
      .string()
      .min(8, { message: "Confirm password is required." }),
    phone: z.string().trim().optional().nullable(),
    dob: z.string().trim().optional().nullable(),
    gender: z.string().trim().optional().nullable(),
    address: z.string().trim().optional().nullable(),
    emergency_contact: z.string().trim().optional().nullable(),
    goal: z.string().trim().optional().nullable(),
    height: z.union([z.string(), z.number()]).optional().nullable(),
    current_weight: z.union([z.string(), z.number()]).optional().nullable(),
    body_fat: z.union([z.string(), z.number()]).optional().nullable(),
    chest: z.union([z.string(), z.number()]).optional().nullable(),
    waist: z.union([z.string(), z.number()]).optional().nullable(),
    arms: z.union([z.string(), z.number()]).optional().nullable(),
    thigh: z.union([z.string(), z.number()]).optional().nullable(),
    medical_conditions: z.string().trim().optional().nullable(),
    allergies: z.string().trim().optional().nullable(),
    injuries: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;
  let profileCreated = false;

  try {
    // 1. Parse JSON body safely
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    // 2. Validate form data with Zod
    const parseResult = clientInviteRegisterSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      );
    }

    const {
      token: rawToken,
      full_name: fullName,
      password,
      phone,
      dob,
      gender,
      address,
      emergency_contact: emergencyContact,
      goal,
      height,
      current_weight: currentWeight,
      body_fat: bodyFat,
      chest,
      waist,
      arms,
      thigh,
      medical_conditions: medicalConditions,
      allergies,
      injuries,
    } = parseResult.data;

    // 3. Token format check (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]{32,128}$/.test(rawToken)) {
      return NextResponse.json(
        { success: false, message: "Invalid invitation token format." },
        { status: 400 }
      );
    }

    // 4. Compute SHA-256 hash in memory (never log or store raw token)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 5. Query invitation record using token_hash
    const dbClient = supabaseAdmin || supabase;
    const { data: invitation, error: invQueryError } = await dbClient
      .from("client_invitations")
      .select("id, trainer_id, client_email, status, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invQueryError) {
      console.error("Database query failed while fetching invitation:", invQueryError.message);
      return NextResponse.json(
        { success: false, message: "Database error during invitation verification." },
        { status: 500 }
      );
    }

    // 6. Validate invitation existence and status
    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found or invalid." },
        { status: 404 }
      );
    }

    if (invitation.status === "accepted") {
      return NextResponse.json(
        { success: false, message: "This invitation has already been used." },
        { status: 410 }
      );
    }

    if (invitation.status === "revoked") {
      return NextResponse.json(
        { success: false, message: "This invitation has been revoked." },
        { status: 410 }
      );
    }

    // Check expiration
    const isExpired =
      invitation.status === "expired" ||
      new Date(invitation.expires_at) <= new Date();

    if (isExpired) {
      if (invitation.status === "pending") {
        await dbClient
          .from("client_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);
      }
      return NextResponse.json(
        { success: false, message: "This invitation has expired." },
        { status: 410 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "This invitation is no longer valid." },
        { status: 410 }
      );
    }

    // 7. Verify server-side Supabase admin client configuration
    if (!supabaseAdmin) {
      console.error("Client registration failed: Server-side SUPABASE_SECRET_KEY is not configured.");
      return NextResponse.json(
        { success: false, message: "Server configuration error: SUPABASE_SECRET_KEY is required." },
        { status: 500 }
      );
    }

    const clientEmail = invitation.client_email.trim().toLowerCase();

    // 8. Create Supabase Auth User with admin API (email is strictly locked to invitation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: clientEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: "client",
        full_name: fullName.trim(),
      },
    });

    if (authError || !authData.user) {
      const authErrMsg = authError?.message || "";
      console.error("Supabase Auth user creation error for invited client:", authErrMsg);

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
        {
          success: false,
          message: authError?.message || "Failed to create authentication user.",
        },
        { status: authError?.status || 400 }
      );
    }

    const authUser = authData.user;
    createdAuthUserId = authUser.id;

    // 9. Create public.profiles record with complete personal, goal, & health data
    const parsedHeight =
      height !== undefined && height !== null && height !== ""
        ? parseFloat(String(height)) || null
        : null;

    const profilePayload: Record<string, unknown> = {
      id: createdAuthUserId,
      full_name: fullName.trim(),
      email: clientEmail,
      role: "client",
      phone: phone || null,
      dob: dob || null,
      gender: gender || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
      goal: goal || null,
      height: parsedHeight,
      medical_conditions: medicalConditions || null,
      allergies: allergies || null,
      injuries: injuries || null,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Profile creation failed for invited client:", profileError.message);
      throw new Error("Profile creation failed: " + profileError.message);
    }
    profileCreated = true;

    // 10. Assign client to trainer in public.trainer_client
    const { error: assignError } = await supabaseAdmin
      .from("trainer_client")
      .insert({
        trainer_id: invitation.trainer_id,
        client_id: createdAuthUserId,
      });

    if (assignError) {
      console.error("Trainer-client mapping failed for invited client:", assignError.message);
      throw new Error("Trainer assignment failed: " + assignError.message);
    }

    // 11. Initial Baseline Fitness Data (including weight, body fat, circumferences, and thigh)
    if (currentWeight !== undefined && currentWeight !== null && currentWeight !== "") {
      const parsedWeight = parseFloat(String(currentWeight));
      if (!isNaN(parsedWeight) && parsedWeight > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const progressPayload = {
          client_id: createdAuthUserId,
          date: todayStr,
          weight_kg: parsedWeight,
          body_fat_pct: bodyFat ? parseFloat(String(bodyFat)) || null : null,
          chest_cm: chest ? parseFloat(String(chest)) || null : null,
          waist_cm: waist ? parseFloat(String(waist)) || null : null,
          biceps_cm: arms ? parseFloat(String(arms)) || null : null,
          thigh_cm: thigh ? parseFloat(String(thigh)) || null : null,
          notes: "Initial baseline metrics recorded during invitation onboarding.",
        };

        const { error: progressError } = await supabaseAdmin
          .from("weight_progress")
          .insert(progressPayload);

        if (progressError) {
          console.warn("Initial weight_progress record insert warning:", progressError.message);
        }
      }
    }

    // 12. Mark invitation as accepted (atomic check to guarantee single-use & race-condition prevention)
    const { error: acceptError } = await supabaseAdmin
      .from("client_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)
      .eq("status", "pending");

    if (acceptError) {
      console.error("Failed to mark invitation as accepted:", acceptError.message);
    }

    // 13. Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please log in.",
        data: {
          user: {
            id: createdAuthUserId,
            email: clientEmail,
            fullName: fullName.trim(),
            role: "client",
          },
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error during client invitation registration execution:", err);

    // Rollback handling: Clean up orphaned Auth User and Profile if an intermediate failure occurred
    if (createdAuthUserId && supabaseAdmin) {
      try {
        if (profileCreated) {
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", createdAuthUserId);
        }
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        console.log(`Rollback completed: cleaned up orphaned auth user ${createdAuthUserId}`);
      } catch (rollbackErr) {
        console.error("Rollback error after registration failure:", rollbackErr);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "An unexpected server error occurred during registration.",
      },
      { status: 500 }
    );
  }
}
