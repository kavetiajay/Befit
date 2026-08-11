import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: progressId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(progressId)) {
      return NextResponse.json(
        { success: false, message: "Invalid progress ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find progress log details
    const dbClient = supabaseAdmin || supabase;
    const { data: progress, error: findError } = await dbClient
      .from("weight_progress")
      .select("*")
      .eq("id", progressId)
      .single();

    if (findError || !progress) {
      return NextResponse.json(
        { success: false, message: "Progress record not found." },
        { status: 404 }
      );
    }

    // 4. Verify Authorization
    if (role === "client") {
      if (progress.client_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (role === "trainer") {
      const assigned = await isAssignedClient(user.id, progress.client_id);
      if (!assigned) {
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
    
    // Prohibit changing client_id or id
    if (body.client_id !== undefined || body.id !== undefined) {
      return NextResponse.json(
        { success: false, message: "Modifying record identity/ownership fields is prohibited." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "date",
      "weight_kg",
      "body_fat_pct",
      "chest_cm",
      "waist_cm",
      "hips_cm",
      "biceps_cm",
      "notes",
    ];

    const updatePayload: Record<string, unknown> = {};
    let hasUpdates = false;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return NextResponse.json(
        { success: false, message: "No fields provided for update." },
        { status: 400 }
      );
    }

    // Input validations
    if (updatePayload.date !== undefined) {
      if (typeof updatePayload.date !== "string" || !DATE_REGEX.test(updatePayload.date)) {
        return NextResponse.json(
          { success: false, message: "Date must be in YYYY-MM-DD format." },
          { status: 400 }
        );
      }

      // Check conflict if changing date
      if (updatePayload.date !== progress.date) {
        const { data: duplicateEntry, error: dupError } = await dbClient
          .from("weight_progress")
          .select("id")
          .eq("client_id", progress.client_id)
          .eq("date", updatePayload.date)
          .maybeSingle();

        if (!dupError && duplicateEntry) {
          return NextResponse.json(
            { success: false, message: "A weight progress log already exists for this client and the updated date." },
            { status: 409 }
          );
        }
      }
    }

    if (updatePayload.weight_kg !== undefined && (typeof updatePayload.weight_kg !== "number" || updatePayload.weight_kg <= 0)) {
      return NextResponse.json(
        { success: false, message: "Weight must be a positive number." },
        { status: 400 }
      );
    }

    // Body measurements check
    const measurements = ["body_fat_pct", "chest_cm", "waist_cm", "hips_cm", "biceps_cm"];
    for (const m of measurements) {
      if (updatePayload[m] !== undefined && updatePayload[m] !== null && (typeof updatePayload[m] !== "number" || (updatePayload[m] as number) <= 0)) {
        return NextResponse.json(
          { success: false, message: `${m.replace("_", " ")} must be a positive number.` },
          { status: 400 }
        );
      }
    }

    // Cast properties
    if (updatePayload.weight_kg !== undefined) updatePayload.weight_kg = Number(updatePayload.weight_kg);
    for (const m of measurements) {
      if (updatePayload[m] !== undefined && updatePayload[m] !== null) {
        updatePayload[m] = Number(updatePayload[m]);
      }
    }

    // 6. Update database under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedProgress, error: updateError } = await requestClient
      .from("weight_progress")
      .update(updatePayload)
      .eq("id", progressId)
      .select()
      .single();

    if (updateError) {
      console.error("Progress update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update progress record: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Weight progress record updated successfully",
        data: {
          weightProgress: updatedProgress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/progress/weight/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: progressId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(progressId)) {
      return NextResponse.json(
        { success: false, message: "Invalid progress ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find progress log details
    const dbClient = supabaseAdmin || supabase;
    const { data: progress, error: findError } = await dbClient
      .from("weight_progress")
      .select("client_id")
      .eq("id", progressId)
      .single();

    if (findError || !progress) {
      return NextResponse.json(
        { success: false, message: "Progress record not found." },
        { status: 404 }
      );
    }

    // 4. Verify Authorization
    if (role === "client") {
      if (progress.client_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (role === "trainer") {
      const assigned = await isAssignedClient(user.id, progress.client_id);
      if (!assigned) {
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

    // 5. Delete progress log under RLS
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("weight_progress")
      .delete()
      .eq("id", progressId);

    if (deleteError) {
      console.error("Progress log deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete progress record: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Weight progress record deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/progress/weight/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
