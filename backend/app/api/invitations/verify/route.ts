import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token");

    // 1. Validate token parameter presence
    if (!rawToken || typeof rawToken !== "string" || !rawToken.trim()) {
      return NextResponse.json(
        { success: false, message: "Invitation token is required." },
        { status: 400 }
      );
    }

    const trimmedToken = rawToken.trim();

    // 2. Validate token format (must be 32 to 128 alphanumeric characters)
    if (!/^[a-zA-Z0-9_-]{32,128}$/.test(trimmedToken)) {
      return NextResponse.json(
        { success: false, message: "Invalid invitation token format." },
        { status: 400 }
      );
    }

    // 3. Compute SHA-256 hash (never store or log raw token)
    const tokenHash = crypto.createHash("sha256").update(trimmedToken).digest("hex");

    // Use admin client if available to query by token_hash
    const dbClient = supabaseAdmin || supabase;

    // 4. Query client_invitations by token_hash
    const { data: invitation, error: queryError } = await dbClient
      .from("client_invitations")
      .select("id, client_email, status, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (queryError) {
      console.error("Database query error while verifying invitation:", queryError.message);
      return NextResponse.json(
        { success: false, message: "Database query failed while verifying invitation." },
        { status: 500 }
      );
    }

    // 5. Handle non-existent invitation
    if (!invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found or invalid." },
        { status: 404 }
      );
    }

    // 6. Check statuses
    if (invitation.status === "accepted") {
      return NextResponse.json(
        { success: false, message: "This invitation has already been used." },
        { status: 410 }
      );
    }

    if (invitation.status === "revoked") {
      return NextResponse.json(
        { success: false, message: "This invitation has been revoked." },
        { status: 410 }
      );
    }

    // Check expiration
    const isExpired =
      invitation.status === "expired" ||
      new Date(invitation.expires_at) <= new Date();

    if (isExpired) {
      // Mark as expired in database if still marked pending
      if (invitation.status === "pending") {
        await dbClient
          .from("client_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);
      }

      return NextResponse.json(
        { success: false, message: "This invitation has expired." },
        { status: 410 }
      );
    }

    // 7. Return safe metadata for valid pending invitation
    return NextResponse.json(
      {
        success: true,
        invitation: {
          client_email: invitation.client_email,
          expires_at: invitation.expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invitation verification exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while verifying invitation." },
      { status: 500 }
    );
  }
}
