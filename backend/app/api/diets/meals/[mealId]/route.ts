import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ mealId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { mealId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(mealId)) {
      return NextResponse.json(
        { success: false, message: "Invalid meal ID format." },
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

    // 3. Find meal entry to obtain the plan ID
    const dbClient = supabaseAdmin || supabase;
    const { data: meal, error: findError } = await dbClient
      .from("diet_meals")
      .select("diet_plan_id")
      .eq("id", mealId)
      .single();

    if (findError || !meal) {
      return NextResponse.json(
        { success: false, message: "Diet meal entry not found." },
        { status: 404 }
      );
    }

    // 4. Fetch diet plan details
    const { data: plan, error: planError } = await dbClient
      .from("diet_plans")
      .select("client_id")
      .eq("id", meal.diet_plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Associated diet plan not found." },
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
      "meal_type",
      "food_name",
      "quantity",
      "calories",
      "protein_grams",
      "carbs_grams",
      "fat_grams",
      "meal_time",
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
    if (updatePayload.meal_type !== undefined && (typeof updatePayload.meal_type !== "string" || !updatePayload.meal_type.trim())) {
      return NextResponse.json(
        { success: false, message: "Meal type description cannot be empty." },
        { status: 400 }
      );
    }

    if (updatePayload.food_name !== undefined && (typeof updatePayload.food_name !== "string" || !updatePayload.food_name.trim())) {
      return NextResponse.json(
        { success: false, message: "Food name cannot be empty." },
        { status: 400 }
      );
    }

    if (updatePayload.quantity !== undefined && (typeof updatePayload.quantity !== "string" || !updatePayload.quantity.trim())) {
      return NextResponse.json(
        { success: false, message: "Quantity cannot be empty." },
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

    // Math.floor where appropriate
    if (updatePayload.calories !== undefined && updatePayload.calories !== null) {
      updatePayload.calories = Math.floor(updatePayload.calories as number);
    }
    if (updatePayload.protein_grams !== undefined && updatePayload.protein_grams !== null) {
      updatePayload.protein_grams = Math.floor(updatePayload.protein_grams as number);
    }
    if (updatePayload.carbs_grams !== undefined && updatePayload.carbs_grams !== null) {
      updatePayload.carbs_grams = Math.floor(updatePayload.carbs_grams as number);
    }
    if (updatePayload.fat_grams !== undefined && updatePayload.fat_grams !== null) {
      updatePayload.fat_grams = Math.floor(updatePayload.fat_grams as number);
    }

    // 7. Perform update under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedMeal, error: updateError } = await requestClient
      .from("diet_meals")
      .update(updatePayload)
      .eq("id", mealId)
      .select()
      .single();

    if (updateError) {
      console.error("Diet meal entry update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update diet meal: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet meal entry updated successfully",
        data: {
          dietMeal: updatedMeal,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/diets/meals/[mealId] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { mealId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(mealId)) {
      return NextResponse.json(
        { success: false, message: "Invalid meal ID format." },
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

    // 3. Find meal entry to obtain plan ID
    const dbClient = supabaseAdmin || supabase;
    const { data: meal, error: findError } = await dbClient
      .from("diet_meals")
      .select("diet_plan_id")
      .eq("id", mealId)
      .single();

    if (findError || !meal) {
      return NextResponse.json(
        { success: false, message: "Diet meal entry not found." },
        { status: 404 }
      );
    }

    // 4. Fetch diet plan details
    const { data: plan, error: planError } = await dbClient
      .from("diet_plans")
      .select("client_id")
      .eq("id", meal.diet_plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, message: "Associated diet plan not found." },
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

    // 6. Delete meal entry under RLS
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("diet_meals")
      .delete()
      .eq("id", mealId);

    if (deleteError) {
      console.error("Diet meal entry deletion failed:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete meal entry: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet meal entry deleted successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/diets/meals/[mealId] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
