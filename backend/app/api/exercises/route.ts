import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();
    const requestClient = getRequestClient(token);

    // 2. Fetch exercises
    const { data: exercises, error } = await requestClient
      .from("exercises")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error retrieving exercises:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve exercises." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Exercises retrieved successfully",
        data: {
          exercises,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/exercises exception caught:", error);
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

    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();
    const requestClient = getRequestClient(token);

    // 2. Parse request body
    const body = await request.json();
    const { name, description, muscle_group, equipment, instructions, video_url } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Exercise name is required." },
        { status: 400 }
      );
    }

    const exercisePayload = {
      name: name.trim(),
      description: description || null,
      muscle_group: muscle_group || null,
      equipment: equipment || null,
      instructions: instructions || null,
      video_url: video_url || null,
    };

    // 3. Create exercise in database
    // We can use supabaseAdmin or requestClient. Under default database setup, exercises table is readable by everyone,
    // but inserts might be restricted or allowed by trainers. Let's use requestClient.
    const { data, error } = await requestClient
      .from("exercises")
      .insert(exercisePayload)
      .select()
      .single();

    if (error) {
      console.error("Failed to create exercise:", error.message);
      
      // Check for unique key constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, message: "An exercise with this name already exists." },
          { status: 400 }
        );
      }

      // Fallback: If requestClient RLS fails due to trainer role, try with admin client
      const dbClient = supabaseAdmin || supabase;
      const { data: adminData, error: adminError } = await dbClient
        .from("exercises")
        .insert(exercisePayload)
        .select()
        .single();

      if (adminError) {
        console.error("Failed to create exercise via admin:", adminError.message);
        return NextResponse.json(
          { success: false, message: "Failed to save exercise: " + adminError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Exercise created successfully",
          data: {
            exercise: adminData,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Exercise created successfully",
        data: {
          exercise: data,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/exercises exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving the exercise." },
      { status: 500 }
    );
  }
}
