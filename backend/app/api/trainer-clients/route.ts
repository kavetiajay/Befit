import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    // 1. Enforce Trainer role authorization
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 2. Query assigned clients for the currently logged-in trainer
    const requestClient = getRequestClient(token);
    const { data, error } = await requestClient
      .from("trainer_client")
      .select("assigned_at, client:profiles!client_id(id, full_name, email, phone, dob, gender, address, emergency_contact, created_at, updated_at)")
      .eq("trainer_id", user.id);

    if (error) {
      console.error("Error retrieving trainer clients:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve trainer clients." },
        { status: 500 }
      );
    }

    const clients = (data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        if (!item.client) return null;
        return {
          ...item.client,
          assigned_at: item.assigned_at,
        };
      })
      .filter((c) => c !== null);

    return NextResponse.json(
      {
        success: true,
        message: "Trainer clients retrieved successfully",
        data: {
          clients,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/trainer-clients exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Trainer role authorization
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 2. Parse request body and validate UUID format
    const body = await request.json();
    const { client_id: clientId } = body;

    if (!clientId || typeof clientId !== "string" || !UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "A valid client ID (UUID) is required." },
        { status: 400 }
      );
    }

    // 3. Verify client profile exists and actually holds the 'client' role
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
        { success: false, message: "Cannot assign a trainer as a client." },
        { status: 400 }
      );
    }

    // 4. Check if the client is already assigned
    const { data: existingAssignment, error: findError } = await dbClient
      .from("trainer_client")
      .select("trainer_id")
      .eq("client_id", clientId)
      .single();

    if (!findError && existingAssignment) {
      if (existingAssignment.trainer_id === user.id) {
        return NextResponse.json(
          {
            success: true,
            message: "Client is already assigned to you.",
            data: {},
          },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { success: false, message: "This client is already assigned to another trainer." },
          { status: 400 }
        );
      }
    }

    // 5. Create new assignment
    const requestClient = getRequestClient(token);
    const { error: insertError } = await requestClient
      .from("trainer_client")
      .insert({
        trainer_id: user.id,
        client_id: clientId,
      });

    if (insertError) {
      console.error("Trainer-client assignment insert failed:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to assign client: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client assigned successfully",
        data: {},
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/trainer-clients exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing the assignment." },
      { status: 500 }
    );
  }
}
