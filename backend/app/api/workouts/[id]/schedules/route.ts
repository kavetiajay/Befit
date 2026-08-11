import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: planId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(planId)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan ID format." },
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

    // 3. Fetch workout plan details
    const dbClient = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await dbClient
      .from("workout_plans")
      .select("client_id")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Workout plan not found." },
        { status: 404 }
      );
    }

    // 4. Verify trainer is assigned to client
    const assigned = await isAssignedClient(user.id, plan.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate fields
    const body = await request.json();
    const {
      day_of_week,
      exercise_id,
      sets,
      reps,
      weight_kg,
      duration_seconds,
      rest_seconds,
      order_index,
      notes,
    } = body;

    if (!day_of_week || !DAYS_OF_WEEK.includes(day_of_week)) {
      return NextResponse.json(
        { success: false, message: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(", ")}` },
        { status: 400 }
      );
    }

    if (!exercise_id || typeof exercise_id !== "string" || !UUID_REGEX.test(exercise_id)) {
      return NextResponse.json(
        { success: false, message: "A valid exercise ID (UUID) is required." },
        { status: 400 }
      );
    }

    if (sets === undefined || typeof sets !== "number" || sets < 1) {
      return NextResponse.json(
        { success: false, message: "Sets count must be a positive integer." },
        { status: 400 }
      );
    }

    if (!reps || typeof reps !== "string" || !reps.trim()) {
      return NextResponse.json(
        { success: false, message: "Reps format details are required (e.g. '10-12' or 'failure')." },
        { status: 400 }
      );
    }

    if (order_index === undefined || typeof order_index !== "number" || order_index < 0) {
      return NextResponse.json(
        { success: false, message: "Order index must be a non-negative integer." },
        { status: 400 }
      );
    }

    // 6. Verify exercise exists
    const { data: targetExercise, error: exerciseError } = await dbClient
      .from("exercises")
      .select("id")
      .eq("id", exercise_id)
      .single();

    if (exerciseError || !targetExercise) {
      return NextResponse.json(
        { success: false, message: "Exercise not found." },
        { status: 404 }
      );
    }

    // 7. Insert workout schedule entry
    const requestClient = getRequestClient(token);
    const schedulePayload = {
      workout_plan_id: planId,
      day_of_week,
      exercise_id,
      sets: Math.floor(sets),
      reps: reps.trim(),
      weight_kg: weight_kg !== undefined ? Number(weight_kg) : null,
      duration_seconds: duration_seconds !== undefined ? Math.floor(Number(duration_seconds)) : null,
      rest_seconds: rest_seconds !== undefined ? Math.floor(Number(rest_seconds)) : null,
      order_index: Math.floor(order_index),
      notes: notes || null,
    };

    const { data: newSchedule, error: insertError } = await requestClient
      .from("workout_schedules")
      .insert(schedulePayload)
      .select("*, exercise:exercises(*)")
      .single();

    if (insertError) {
      console.error("Workout schedule entry insert failed:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to add workout schedule entry: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout schedule entry added successfully",
        data: {
          workoutSchedule: newSchedule,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/workouts/[id]/schedules exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving the schedule entry." },
      { status: 500 }
    );
  }
}
