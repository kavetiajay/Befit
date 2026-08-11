import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
    const startDateParam = searchParams.get("startDate") || searchParams.get("start_date");
    const endDateParam = searchParams.get("endDate") || searchParams.get("end_date");

    const requestClient = getRequestClient(token);
    let query = requestClient.from("weight_progress").select("*");

    // Authorization & filtering
    if (role === "client") {
      if (clientIdParam && clientIdParam !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
      query = query.eq("client_id", user.id);
    } else if (role === "trainer") {
      if (clientIdParam) {
        if (!UUID_REGEX.test(clientIdParam)) {
          return NextResponse.json(
            { success: false, message: "Invalid client ID format." },
            { status: 400 }
          );
        }

        const assigned = await isAssignedClient(user.id, clientIdParam);
        if (!assigned) {
          return NextResponse.json(
            { success: false, message: "Forbidden. This client is not assigned to you." },
            { status: 403 }
          );
        }
        query = query.eq("client_id", clientIdParam);
      } else {
        // Retrieve trainer-assigned clients list
        const { data: assignments, error: assignError } = await requestClient
          .from("trainer_client")
          .select("client_id")
          .eq("trainer_id", user.id);

        if (assignError) {
          console.error("Trainer clients lookup error:", assignError.message);
          return NextResponse.json(
            { success: false, message: "Failed to retrieve assigned client list." },
            { status: 500 }
          );
        }

        const clientIds = (assignments || []).map((a) => a.client_id);
        if (clientIds.length === 0) {
          return NextResponse.json(
            {
              success: true,
              message: "Weight progress retrieved successfully",
              data: { weightProgress: [] },
            },
            { status: 200 }
          );
        }
        query = query.in("client_id", clientIds);
      }
    }

    // Date filters validation & application
    if (startDateParam) {
      if (!DATE_REGEX.test(startDateParam)) {
        return NextResponse.json(
          { success: false, message: "Start date must be in YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      query = query.gte("date", startDateParam);
    }

    if (endDateParam) {
      if (!DATE_REGEX.test(endDateParam)) {
        return NextResponse.json(
          { success: false, message: "End date must be in YYYY-MM-DD format." },
          { status: 400 }
        );
      }
      query = query.lte("date", endDateParam);
    }

    const { data: progressLogs, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Error retrieving weight progress logs:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve weight progress records." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Weight progress records retrieved successfully",
        data: {
          weightProgress: progressLogs,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/progress/weight exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 2. Parse request body
    const body = await request.json();
    const {
      client_id: clientId,
      date,
      weight_kg,
      body_fat_pct,
      chest_cm,
      waist_cm,
      hips_cm,
      biceps_cm,
      notes,
    } = body;

    // Validation
    if (!clientId || typeof clientId !== "string" || !UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "A valid client ID (UUID) is required." },
        { status: 400 }
      );
    }
    if (!date || typeof date !== "string" || !DATE_REGEX.test(date)) {
      return NextResponse.json(
        { success: false, message: "A valid date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }
    if (weight_kg === undefined || typeof weight_kg !== "number" || weight_kg <= 0) {
      return NextResponse.json(
        { success: false, message: "Weight (kg) must be a positive number." },
        { status: 400 }
      );
    }

    // Body measurements validations
    const measurementFields = { body_fat_pct, chest_cm, waist_cm, hips_cm, biceps_cm };
    for (const [key, val] of Object.entries(measurementFields)) {
      if (val !== undefined && (typeof val !== "number" || val <= 0)) {
        return NextResponse.json(
          { success: false, message: `${key.replace("_", " ")} must be a positive number.` },
          { status: 400 }
        );
      }
    }

    // 3. Authorization check
    if (role === "client") {
      if (clientId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. You can only record progress for your own profile." },
          { status: 403 }
        );
      }
    } else if (role === "trainer") {
      const assigned = await isAssignedClient(user.id, clientId);
      if (!assigned) {
        return NextResponse.json(
          { success: false, message: "Forbidden. This client is not assigned to you." },
          { status: 403 }
        );
      }
    }

    // 4. Verify client exists
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
        { success: false, message: "Cannot record progress for a non-client user." },
        { status: 400 }
      );
    }

    // 5. Check for duplicate logs (prevent duplicates for same client and date)
    const { data: existingProgress, error: findError } = await dbClient
      .from("weight_progress")
      .select("id")
      .eq("client_id", clientId)
      .eq("date", date)
      .maybeSingle();

    if (!findError && existingProgress) {
      return NextResponse.json(
        { success: false, message: "A progress log already exists for this client and date." },
        { status: 409 }
      );
    }

    // 6. Insert progress record
    const requestClient = getRequestClient(token);
    const progressPayload = {
      client_id: clientId,
      date,
      weight_kg: Number(weight_kg),
      body_fat_pct: body_fat_pct !== undefined ? Number(body_fat_pct) : null,
      chest_cm: chest_cm !== undefined ? Number(chest_cm) : null,
      waist_cm: waist_cm !== undefined ? Number(waist_cm) : null,
      hips_cm: hips_cm !== undefined ? Number(hips_cm) : null,
      biceps_cm: biceps_cm !== undefined ? Number(biceps_cm) : null,
      notes: notes || null,
    };

    const { data: newProgress, error: insertError } = await requestClient
      .from("weight_progress")
      .insert(progressPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create progress record:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to record weight progress: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Weight progress recorded successfully",
        data: {
          weightProgress: newProgress,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/progress/weight exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving progress." },
      { status: 500 }
    );
  }
}
