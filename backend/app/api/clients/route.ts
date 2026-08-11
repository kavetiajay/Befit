import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient } from "@/lib/supabase/auth";

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

    // 2. Query assigned clients from the trainer_client join table
    const requestClient = getRequestClient(token);
    const { data, error } = await requestClient
      .from("trainer_client")
      .select("assigned_at, client:profiles!client_id(id, full_name, email, phone, dob, gender, address, emergency_contact, created_at, updated_at)")
      .eq("trainer_id", user.id);

    if (error) {
      console.error("Error fetching assigned clients:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve clients from database." },
        { status: 500 }
      );
    }

    // Extract client profiles
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
        message: "Clients retrieved successfully",
        data: {
          clients,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/clients exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
