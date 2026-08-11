import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("clientId") || searchParams.get("client_id");

    const requestClient = getRequestClient(token);
    let query = requestClient.from("diet_plans").select("*");

    if (role === "client") {
      // Client can only view their own plans
      if (clientIdParam && clientIdParam !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
      query = query.eq("client_id", user.id);
    } else if (role === "trainer") {
      if (clientIdParam) {
        // Validate UUID format
        if (!UUID_REGEX.test(clientIdParam)) {
          return NextResponse.json(
            { success: false, message: "Invalid client ID format." },
            { status: 400 }
          );
        }

        // Trainer must be assigned to this client
        const assigned = await isAssignedClient(user.id, clientIdParam);
        if (!assigned) {
          return NextResponse.json(
            { success: false, message: "Forbidden. This client is not assigned to you." },
            { status: 403 }
          );
        }
        query = query.eq("client_id", clientIdParam);
      } else {
        // If no client is specified, return plans created by this trainer
        query = query.eq("trainer_id", user.id);
      }
    }

    const { data: plans, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving diet plans:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve diet plans." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet plans retrieved successfully",
        data: {
          dietPlans: plans,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/diets exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Trainer role authentication
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 2. Parse request body
    const body = await request.json();
    const {
      client_id: clientId,
      name,
      goal,
      calories,
      protein_grams,
      carbs_grams,
      fat_grams,
      start_date,
      end_date,
      is_active,
    } = body;

    // Validation
    if (!clientId || typeof clientId !== "string" || !UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "A valid client ID (UUID) is required." },
        { status: 400 }
      );
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Diet plan name is required." },
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

    // 3. Verify client exists and has client role
    const dbClient = supabaseAdmin || supabase;
    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select("role")
      .eq("id", clientId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { success: false, message: "Client not found." },
        { status: 404 }
      );
    }

    if (targetProfile.role !== "client") {
      return NextResponse.json(
        { success: false, message: "Cannot create diet plan for a non-client." },
        { status: 400 }
      );
    }

    // 4. Verify trainer is assigned to client
    const assigned = await isAssignedClient(user.id, clientId);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. This client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Create diet plan
    const requestClient = getRequestClient(token);
    const planPayload = {
      client_id: clientId,
      trainer_id: user.id,
      name: name.trim(),
      goal: goal || null,
      calories: calories !== undefined ? Math.floor(calories) : null,
      protein_grams: protein_grams !== undefined ? Math.floor(protein_grams) : null,
      carbs_grams: carbs_grams !== undefined ? Math.floor(carbs_grams) : null,
      fat_grams: fat_grams !== undefined ? Math.floor(fat_grams) : null,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: is_active !== undefined ? !!is_active : true,
    };

    const { data: newPlan, error: insertError } = await requestClient
      .from("diet_plans")
      .insert(planPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create diet plan:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to create diet plan: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Diet plan created successfully",
        data: {
          dietPlan: newPlan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/diets exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving the diet plan." },
      { status: 500 }
    );
  }
}
