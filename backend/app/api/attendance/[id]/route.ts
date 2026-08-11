import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: logId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(logId)) {
      return NextResponse.json(
        { success: false, message: "Invalid log ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce Trainer role authentication
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find attendance entry
    const dbClient = supabaseAdmin || supabase;
    const { data: attendance, error: findError } = await dbClient
      .from("attendance")
      .select("*")
      .eq("id", logId)
      .single();

    if (findError || !attendance) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    // 4. Verify trainer is assigned to the client
    const assigned = await isAssignedClient(user.id, attendance.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate update fields
    const body = await request.json();


    const allowedFields = ["date", "status", "check_in_time", "notes"];
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

    // Validation checks
    if (updatePayload.date !== undefined) {
      if (typeof updatePayload.date !== "string" || !DATE_REGEX.test(updatePayload.date)) {
        return NextResponse.json(
          { success: false, message: "Date must be in YYYY-MM-DD format." },
          { status: 400 }
        );
      }

      // Check conflict if changing date
      if (updatePayload.date !== attendance.date) {
        const { data: duplicateEntry, error: dupError } = await dbClient
          .from("attendance")
          .select("id")
          .eq("client_id", attendance.client_id)
          .eq("date", updatePayload.date)
          .maybeSingle();

        if (!dupError && duplicateEntry) {
          return NextResponse.json(
            { success: false, message: "An attendance record already exists for this client and the updated date." },
            { status: 409 }
          );
        }
      }
    }

    if (updatePayload.status !== undefined && updatePayload.status !== "present" && updatePayload.status !== "absent") {
      return NextResponse.json(
        { success: false, message: "Status must be either 'present' or 'absent'." },
        { status: 400 }
      );
    }

    // 6. Perform update in database under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedAttendance, error: updateError } = await requestClient
      .from("attendance")
      .update(updatePayload)
      .eq("id", logId)
      .select()
      .single();

    if (updateError) {
      console.error("Attendance update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update attendance log: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance record updated successfully",
        data: {
          attendance: updatedAttendance,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/attendance/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: logId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(logId)) {
      return NextResponse.json(
        { success: false, message: "Invalid log ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce Trainer role authentication
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find attendance entry
    const dbClient = supabaseAdmin || supabase;
    const { data: attendance, error: findError } = await dbClient
      .from("attendance")
      .select("client_id")
      .eq("id", logId)
      .single();

    if (findError || !attendance) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found." },
        { status: 404 }
      );
    }

    // 4. Verify trainer is assigned to client
    const assigned = await isAssignedClient(user.id, attendance.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Delete attendance record under RLS
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("attendance")
      .delete()
      .eq("id", logId);

    if (deleteError) {
      console.error("Attendance deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete attendance record: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance record deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/attendance/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
