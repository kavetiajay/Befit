import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // 5. Parse request body and validate fields
    const body = await request.json();
    const {
      meal_type,
      food_name,
      quantity,
      calories,
      protein_grams,
      carbs_grams,
      fat_grams,
      meal_time,
      notes,
    } = body;

    if (!meal_type || typeof meal_type !== "string" || !meal_type.trim()) {
      return NextResponse.json(
        { success: false, message: "Meal type is required (e.g. 'Breakfast', 'Lunch')." },
        { status: 400 }
      );
    }

    if (!food_name || typeof food_name !== "string" || !food_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Food name is required." },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== "string" || !quantity.trim()) {
      return NextResponse.json(
        { success: false, message: "Quantity is required (e.g. '200g' or '2 eggs')." },
        { status: 400 }
      );
    }

    // Number validations
    if (calories !== undefined && (typeof calories !== "number" || calories < 0)) {
      return NextResponse.json({ success: false, message: "Calories must be a positive number." }, { status: 400 });
    }
    if (protein_grams !== undefined && (typeof protein_grams !== "number" || protein_grams < 0)) {
      return NextResponse.json({ success: false, message: "Protein grams must be a positive number." }, { status: 400 });
    }
    if (carbs_grams !== undefined && (typeof carbs_grams !== "number" || carbs_grams < 0)) {
      return NextResponse.json({ success: false, message: "Carbohydrates grams must be a positive number." }, { status: 400 });
    }
    if (fat_grams !== undefined && (typeof fat_grams !== "number" || fat_grams < 0)) {
      return NextResponse.json({ success: false, message: "Fats grams must be a positive number." }, { status: 400 });
    }

    // 6. Insert diet meal entry
    const requestClient = getRequestClient(token);
    const mealPayload = {
      diet_plan_id: planId,
      meal_type: meal_type.trim(),
      food_name: food_name.trim(),
      quantity: quantity.trim(),
      calories: calories !== undefined ? Math.floor(calories) : null,
      protein_grams: protein_grams !== undefined ? Math.floor(protein_grams) : null,
      carbs_grams: carbs_grams !== undefined ? Math.floor(carbs_grams) : null,
      fat_grams: fat_grams !== undefined ? Math.floor(fat_grams) : null,
      meal_time: meal_time || null,
      notes: notes || null,
    };

    const { data: newMeal, error: insertError } = await requestClient
      .from("diet_meals")
      .insert(mealPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Diet meal entry insert failed:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to add diet meal entry: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet meal entry added successfully",
        data: {
          dietMeal: newMeal,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/diets/[id]/meals exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving the meal entry." },
      { status: 500 }
    );
  }
}
