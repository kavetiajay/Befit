import { NextResponse } from "next/server";
import { requireTrainer, getRequestClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ clientId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { clientId } = await context.params;

    // 1. Validate UUID format
    if (!clientId || !UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "Invalid client ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce Trainer role authorization
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Verify assignment exists
    const dbClient = supabaseAdmin || supabase;
    const { data: assignment, error: findError } = await dbClient
      .from("trainer_client")
      .select("trainer_id")
      .eq("client_id", clientId)
      .single();

    if (findError || !assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found." },
        { status: 404 }
      );
    }

    // 4. Verify that the authenticated trainer owns this assignment
    if (assignment.trainer_id !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You cannot remove another trainer's client assignment." },
        { status: 403 }
      );
    }

    // 5. Delete the assignment
    const requestClient = getRequestClient(token);
    const { error: deleteError } = await requestClient
      .from("trainer_client")
      .delete()
      .eq("client_id", clientId);

    if (deleteError) {
      console.error("Failed to delete trainer-client assignment:", deleteError.message);
      return NextResponse.json(
        { success: false, message: "Failed to remove assignment: " + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client assignment removed successfully",
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/trainer-clients/[clientId] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while removing the assignment." },
      { status: 500 }
    );
  }
}
