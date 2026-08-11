import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface RouteContext {
  params: Promise<{ scheduleId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(scheduleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid schedule ID format." },
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

    // 3. Find schedule entry to obtain the plan ID
    const dbClient = supabaseAdmin || supabase;
    const { data: schedule, error: findError } = await dbClient
      .from("workout_schedules")
      .select("workout_plan_id")
      .eq("id", scheduleId)
      .single();

    if (findError || !schedule) {
      return NextResponse.json(
        { success: false, message: "Workout schedule entry not found." },
        { status: 404 }
      );
    }

    // 4. Fetch workout plan to verify trainer assignment
    const { data: plan, error: planError } = await dbClient
      .from("workout_plans")
      .select("client_id")
      .eq("id", schedule.workout_plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Associated workout plan not found." },
        { status: 404 }
      );
    }

    // 5. Verify trainer is assigned to client
    const assigned = await isAssignedClient(user.id, plan.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 6. Parse request body and validate update fields
    const body = await request.json();
    const allowedFields = [
      "day_of_week",
      "sets",
      "reps",
      "weight_kg",
      "duration_seconds",
      "rest_seconds",
      "order_index",
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

    // Input checks
    if (updatePayload.day_of_week !== undefined && !DAYS_OF_WEEK.includes(updatePayload.day_of_week as string)) {
      return NextResponse.json(
        { success: false, message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(", ")}` },
        { status: 400 }
      );
    }

    if (updatePayload.sets !== undefined && (typeof updatePayload.sets !== "number" || updatePayload.sets < 1)) {
      return NextResponse.json(
        { success: false, message: "Sets count must be a positive integer." },
        { status: 400 }
      );
    }

    if (updatePayload.reps !== undefined && (typeof updatePayload.reps !== "string" || !updatePayload.reps.trim())) {
      return NextResponse.json(
        { success: false, message: "Reps description cannot be empty." },
        { status: 400 }
      );
    }

    if (updatePayload.order_index !== undefined && (typeof updatePayload.order_index !== "number" || updatePayload.order_index < 0)) {
      return NextResponse.json(
        { success: false, message: "Order index must be a non-negative integer." },
        { status: 400 }
      );
    }

    // Math.floor where appropriate
    if (updatePayload.sets !== undefined) updatePayload.sets = Math.floor(updatePayload.sets as number);
    if (updatePayload.duration_seconds !== undefined && updatePayload.duration_seconds !== null) {
      updatePayload.duration_seconds = Math.floor(Number(updatePayload.duration_seconds));
    }
    if (updatePayload.rest_seconds !== undefined && updatePayload.rest_seconds !== null) {
      updatePayload.rest_seconds = Math.floor(Number(updatePayload.rest_seconds));
    }
    if (updatePayload.order_index !== undefined) updatePayload.order_index = Math.floor(updatePayload.order_index as number);

    // 7. Perform update in database under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedSchedule, error: updateError } = await requestClient
      .from("workout_schedules")
      .update(updatePayload)
      .eq("id", scheduleId)
      .select("*, exercise:exercises(*)")
      .single();

    if (updateError) {
      console.error("Workout schedule entry update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update workout schedule: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout schedule entry updated successfully",
        data: {
          workoutSchedule: updatedSchedule,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/workouts/schedules/[scheduleId] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { scheduleId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(scheduleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid schedule ID format." },
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

    // 3. Find schedule entry to obtain plan ID
    const dbClient = supabaseAdmin || supabase;
    const { data: schedule, error: findError } = await dbClient
      .from("workout_schedules")
      .select("workout_plan_id")
      .eq("id", scheduleId)
      .single();

    if (findError || !schedule) {
      return NextResponse.json(
        { success: false, message: "Workout schedule entry not found." },
        { status: 404 }
      );
    }

    // 4. Fetch workout plan details
    const { data: plan, error: planError } = await dbClient
      .from("workout_plans")
      .select("client_id")
      .eq("id", schedule.workout_plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Associated workout plan not found." },
        { status: 404 }
      );
    }

    // 5. Verify trainer is assigned to client
    const assigned = await isAssignedClient(user.id, plan.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 6. Delete schedule entry under RLS
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("workout_schedules")
      .delete()
      .eq("id", scheduleId);

    if (deleteError) {
      console.error("Workout schedule entry deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete schedule entry: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout schedule entry deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workouts/schedules/[scheduleId] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
