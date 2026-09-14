import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireTrainer } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

// Input validation schema using Zod
const inviteSchema = z.object({
  client_email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address." }),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate and verify role = 'trainer'
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user: trainerUser } = authResult;
    const trainerId = trainerUser.id;

    // 2. Parse and validate JSON request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parseResult = inviteSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { client_email: clientEmail } = parseResult.data;

    // Use admin client if configured, otherwise fallback to standard client
    const dbClient = supabaseAdmin || supabase;

    // 3. Check for active duplicate invitation for this trainer and email
    const nowIso = new Date().toISOString();
    const { data: existingInvite, error: checkError } = await dbClient
      .from("client_invitations")
      .select("id, status, expires_at")
      .eq("trainer_id", trainerId)
      .eq("client_email", clientEmail)
      .eq("status", "pending")
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing client invitation:", checkError);
      return NextResponse.json(
        { success: false, message: "Database query failed while checking invitation status." },
        { status: 500 }
      );
    }

    if (existingInvite) {
      return NextResponse.json(
        {
          success: false,
          message: "An active invitation already exists for this email address.",
        },
        { status: 409 }
      );
    }

    // 4. Cryptographically secure token generation and SHA-256 hashing
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 5. Expiration calculation (7 days from creation)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 6. Insert new invitation record into public.client_invitations (storing ONLY token_hash)
    const { error: insertError } = await dbClient
      .from("client_invitations")
      .insert({
        trainer_id: trainerId,
        client_email: clientEmail,
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error creating client invitation record:", insertError);
      return NextResponse.json(
        { success: false, message: "Failed to create client invitation." },
        { status: 500 }
      );
    }

    // 7. Construct invitation URL from request origin or default port
    const rawOrigin = request.headers.get("origin") || request.headers.get("referer") || "";
    let origin = "http://localhost:5173";
    if (rawOrigin) {
      try {
        const parsedUrl = new URL(rawOrigin);
        origin = parsedUrl.origin;
      } catch {
        // keep fallback
      }
    }

    const inviteUrl = `${origin}/#/invite?token=${rawToken}`;

    // 8. Return successful response
    return NextResponse.json(
      {
        success: true,
        invitation: {
          client_email: clientEmail,
          invite_url: inviteUrl,
          expires_at: expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invitation creation exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while creating invitation." },
      { status: 500 }
    );
  }
}
