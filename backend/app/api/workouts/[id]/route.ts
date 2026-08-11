import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: planId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(planId)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;

    // 3. Fetch workout plan details
    const dbClient = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await dbClient
      .from("workout_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Workout plan not found." },
        { status: 404 }
      );
    }

    // 4. Verify authorization
    if (role === "client") {
      if (plan.client_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (role === "trainer") {
      const assigned = await isAssignedClient(user.id, plan.client_id);
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

    // 5. Fetch plan schedules with exercise information
    const { data: schedules, error: scheduleError } = await dbClient
      .from("workout_schedules")
      .select("*, exercise:exercises(*)")
      .eq("workout_plan_id", planId)
      .order("order_index", { ascending: true });

    if (scheduleError) {
      console.error("Error retrieving workout schedules:", scheduleError.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve workout plan schedules." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout plan retrieved successfully",
        data: {
          workoutPlan: {
            ...plan,
            schedules,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/workouts/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    // 4. Verify trainer is assigned to the client
    const assigned = await isAssignedClient(user.id, plan.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate fields
    const body = await request.json();

    const allowedFields = ["name", "goal", "start_date", "end_date", "is_active"];
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

    if (updatePayload.name !== undefined && (typeof updatePayload.name !== "string" || !updatePayload.name.trim())) {
      return NextResponse.json(
        { success: false, message: "Workout plan name cannot be empty." },
        { status: 400 }
      );
    }

    // 6. Perform update under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedPlan, error: updateError } = await requestClient
      .from("workout_plans")
      .update(updatePayload)
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Workout plan update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update workout plan: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout plan updated successfully",
        data: {
          workoutPlan: updatedPlan,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/workouts/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
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

    // 5. Delete plan (Postgres ON DELETE CASCADE cleans up schedules)
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("workout_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) {
      console.error("Workout plan deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete workout plan: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout plan deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/workouts/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
