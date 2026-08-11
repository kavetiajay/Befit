import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getRequestClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

// Helper to validate UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "Invalid client ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role: userRole } = authResult;

    // 3. Verify target profile exists in database
    const dbClient = supabaseAdmin || supabase;
    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select("id, full_name, email, phone, dob, gender, address, emergency_contact, profile_image_url, role, created_at, updated_at")
      .eq("id", clientId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { success: false, message: "Client not found." },
        { status: 404 }
      );
    }

    // 4. Verify Authorization
    if (userRole === "client") {
      // Clients can only access their own profile
      if (user.id !== clientId) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (userRole === "trainer") {
      // Trainers can only access client profiles assigned to them
      if (targetProfile.role !== "client") {
        return NextResponse.json(
          { success: false, message: "Forbidden. Requirers must be assigned to this user." },
          { status: 403 }
        );
      }

      const { data: assignment, error: assignError } = await dbClient
        .from("trainer_client")
        .select("id")
        .eq("client_id", clientId)
        .eq("trainer_id", user.id)
        .single();

      if (assignError || !assignment) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden. Unknown role." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client retrieved successfully",
        data: {
          client: targetProfile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/clients/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "Invalid client ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role: userRole } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Verify target profile exists in database
    const dbClient = supabaseAdmin || supabase;
    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select("id, role")
      .eq("id", clientId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { success: false, message: "Client not found." },
        { status: 404 }
      );
    }

    // 4. Verify Authorization
    if (userRole === "client") {
      // Clients can only update their own profile
      if (user.id !== clientId) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (userRole === "trainer") {
      // Trainers can only update clients assigned to them
      if (targetProfile.role !== "client") {
        return NextResponse.json(
          { success: false, message: "Forbidden. Cannot update non-client accounts." },
          { status: 403 }
        );
      }

      const { data: assignment, error: assignError } = await dbClient
        .from("trainer_client")
        .select("id")
        .eq("client_id", clientId)
        .eq("trainer_id", user.id)
        .single();

      if (assignError || !assignment) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden. Unknown role." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate fields
    const body = await request.json();
    
    // Disallowed modifications: id, role, email, created_at, updated_at
    const forbiddenFields = ["id", "role", "email", "created_at", "updated_at"];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return NextResponse.json(
          { success: false, message: `Updating security field '${field}' is prohibited.` },
          { status: 400 }
        );
      }
    }

    // Allowed profile fields
    const allowedFields = [
      "full_name",
      "phone",
      "dob",
      "gender",
      "address",
      "emergency_contact",
      "profile_image_url"
    ];

    const updatePayload: Record<string, unknown> = {};
    let hasAllowedUpdates = false;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
        hasAllowedUpdates = true;
      }
    }

    if (!hasAllowedUpdates) {
      return NextResponse.json(
        { success: false, message: "No valid profile fields provided for update." },
        { status: 400 }
      );
    }

    // 6. Perform the update under request-specific client RLS
    const requestClient = getRequestClient(token);
    const { data: updatedProfile, error: updateError } = await requestClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", clientId)
      .select("id, full_name, email, phone, dob, gender, address, emergency_contact, profile_image_url, role, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("Profile update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update profile: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
        data: {
          client: updatedProfile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/clients/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
