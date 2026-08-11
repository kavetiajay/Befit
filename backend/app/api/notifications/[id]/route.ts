import { NextResponse } from "next/server";
import { requireAuthenticatedUser, getRequestClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: notificationId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(notificationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find notification details
    const dbClient = supabaseAdmin || supabase;
    const { data: notification, error: findError } = await dbClient
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (findError || !notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found." },
        { status: 404 }
      );
    }

    // 4. Verify user owns this notification
    if (notification.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate fields
    const body = await request.json();
    
    // Database trigger strictly prevents modifying fields other than is_read and read_at
    const forbiddenFields = ["id", "user_id", "title", "message", "type", "created_at"];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return NextResponse.json(
          { success: false, message: `Updating security/read-only field '${field}' is prohibited on notifications.` },
          { status: 400 }
        );
      }
    }

    if (body.is_read === undefined) {
      return NextResponse.json(
        { success: false, message: "Field 'is_read' must be specified for update." },
        { status: 400 }
      );
    }

    // Build trigger-safe payload
    const isRead = !!body.is_read;
    const updatePayload = {
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    };

    // 6. Update notification under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedNotification, error: updateError } = await requestClient
      .from("notifications")
      .update(updatePayload)
      .eq("id", notificationId)
      .select()
      .single();

    if (updateError) {
      console.error("Notification update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update notification status: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification updated successfully",
        data: {
          notification: updatedNotification,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
