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

    // 3. Fetch diet plan details
    const dbClient = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await dbClient
      .from("diet_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Diet plan not found." },
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

    // 5. Fetch associated diet meals
    const { data: meals, error: mealError } = await dbClient
      .from("diet_meals")
      .select("*")
      .eq("diet_plan_id", planId)
      .order("meal_time", { ascending: true });

    if (mealError) {
      console.error("Error retrieving diet meals:", mealError.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve diet meals." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet plan retrieved successfully",
        data: {
          dietPlan: {
            ...plan,
            meals,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/diets/[id] exception caught:", error);
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

    // 3. Fetch diet plan details
    const dbClient = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await dbClient
      .from("diet_plans")
      .select("client_id")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Diet plan not found." },
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
    const allowedFields = [
      "name",
      "goal",
      "calories",
      "protein_grams",
      "carbs_grams",
      "fat_grams",
      "start_date",
      "end_date",
      "is_active",
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

    // Validation checks
    if (updatePayload.name !== undefined && (!updatePayload.name || !(updatePayload.name as string).trim())) {
      return NextResponse.json(
        { success: false, message: "Diet plan name cannot be empty." },
        { status: 400 }
      );
    }
    if (updatePayload.calories !== undefined && (typeof updatePayload.calories !== "number" || updatePayload.calories < 0)) {
      return NextResponse.json({ success: false, message: "Calories must be a positive number." }, { status: 400 });
    }
    if (updatePayload.protein_grams !== undefined && (typeof updatePayload.protein_grams !== "number" || updatePayload.protein_grams < 0)) {
      return NextResponse.json({ success: false, message: "Protein grams must be a positive number." }, { status: 400 });
    }
    if (updatePayload.carbs_grams !== undefined && (typeof updatePayload.carbs_grams !== "number" || updatePayload.carbs_grams < 0)) {
      return NextResponse.json({ success: false, message: "Carbs grams must be a positive number." }, { status: 400 });
    }
    if (updatePayload.fat_grams !== undefined && (typeof updatePayload.fat_grams !== "number" || updatePayload.fat_grams < 0)) {
      return NextResponse.json({ success: false, message: "Fat grams must be a positive number." }, { status: 400 });
    }

    // Math.floor numbers
    if (updatePayload.calories !== undefined) updatePayload.calories = Math.floor(updatePayload.calories as number);
    if (updatePayload.protein_grams !== undefined) updatePayload.protein_grams = Math.floor(updatePayload.protein_grams as number);
    if (updatePayload.carbs_grams !== undefined) updatePayload.carbs_grams = Math.floor(updatePayload.carbs_grams as number);
    if (updatePayload.fat_grams !== undefined) updatePayload.fat_grams = Math.floor(updatePayload.fat_grams as number);

    // 6. Perform update under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedPlan, error: updateError } = await requestClient
      .from("diet_plans")
      .update(updatePayload)
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Diet plan update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update diet plan: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet plan updated successfully",
        data: {
          dietPlan: updatedPlan,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/diets/[id] exception caught:", error);
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

    // 3. Fetch diet plan details
    const dbClient = supabaseAdmin || supabase;
    const { data: plan, error: planError } = await dbClient
      .from("diet_plans")
      .select("client_id")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Diet plan not found." },
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

    // 5. Delete plan (Postgres ON DELETE CASCADE cleans up meals)
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("diet_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) {
      console.error("Diet plan deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete diet plan: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet plan deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/diets/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
