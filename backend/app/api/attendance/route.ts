import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
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
    let query = requestClient.from("attendance").select("*, client:profiles!client_id(id, full_name, email)");

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
              message: "Attendance retrieved successfully",
              data: { attendance: [] },
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

    const { data: attendanceLogs, error } = await query.order("date", { ascending: false });

    if (error) {
      console.error("Error retrieving attendance:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve attendance logs." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance logs retrieved successfully",
        data: {
          attendance: attendanceLogs,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/attendance exception caught:", error);
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
    const { client_id: clientId, date, status, check_in_time, notes } = body;

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
    if (!status || (status !== "present" && status !== "absent")) {
      return NextResponse.json(
        { success: false, message: "Status must be either 'present' or 'absent'." },
        { status: 400 }
      );
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
        { success: false, message: "Cannot mark attendance for a non-client user." },
        { status: 400 }
      );
    }

    // 4. Verify trainer is assigned to this client
    const assigned = await isAssignedClient(user.id, clientId);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. This client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Check for duplicate logs (prevent duplicates for same client and date)
    const { data: existingEntry, error: findError } = await dbClient
      .from("attendance")
      .select("id")
      .eq("client_id", clientId)
      .eq("date", date)
      .maybeSingle();

    if (!findError && existingEntry) {
      return NextResponse.json(
        { success: false, message: "Attendance log already exists for this client and date." },
        { status: 409 }
      );
    }

    // 6. Insert attendance record
    const requestClient = getRequestClient(token);
    const attendancePayload = {
      client_id: clientId,
      date,
      status,
      check_in_time: check_in_time || null,
      notes: notes || null,
    };

    const { data: newAttendance, error: insertError } = await requestClient
      .from("attendance")
      .insert(attendancePayload)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create attendance log:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to record attendance: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded successfully",
        data: {
          attendance: newAttendance,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/attendance exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving attendance." },
      { status: 500 }
    );
  }
}
