import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = ["payment", "workout", "diet", "attendance", "general"];

export async function GET(request: Request) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    const requestClient = getRequestClient(token);
    
    // RLS profiles list only matching auth.uid() notifications
    const { data: notifications, error } = await requestClient
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving notifications:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve notifications." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notifications retrieved successfully",
        data: {
          notifications,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/notifications exception caught:", error);
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
    const { user_id: recipientId, title, message, type } = body;

    // Validation
    if (!recipientId || typeof recipientId !== "string" || !UUID_REGEX.test(recipientId)) {
      return NextResponse.json(
        { success: false, message: "A valid recipient user ID (UUID) is required." },
        { status: 400 }
      );
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title is required." },
        { status: 400 }
      );
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Message content is required." },
        { status: 400 }
      );
    }
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Type must be one of: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Verify client exists and has client role
    const dbClient = supabaseAdmin || supabase;
    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select("role")
      .eq("id", recipientId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { success: false, message: "Recipient user not found." },
        { status: 404 }
      );
    }

    if (targetProfile.role !== "client") {
      return NextResponse.json(
        { success: false, message: "Cannot send client notifications to a non-client user." },
        { status: 400 }
      );
    }

    // 4. Verify trainer is assigned to this client
    const assigned = await isAssignedClient(user.id, recipientId);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. This client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Insert notification record
    const requestClient = getRequestClient(token);
    const notificationPayload = {
      user_id: recipientId,
      title: title.trim(),
      message: message.trim(),
      type,
      is_read: false,
    };

    const { data: newNotification, error: insertError } = await requestClient
      .from("notifications")
      .insert(notificationPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create notification:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to send notification: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notification sent successfully",
        data: {
          notification: newNotification,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/notifications exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving notification." },
      { status: 500 }
    );
  }
}
