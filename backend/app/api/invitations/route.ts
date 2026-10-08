import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { requireTrainer } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

// Input validation schema using Zod
const inviteSchema = z.object({
  client_email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address." }),
});

const patchSchema = z.object({
  id: z.string().uuid({ message: "Invalid invitation ID." }),
  action: z.enum(["revoke", "resend"], { message: "Invalid action." }),
});

/**
 * Safely resolves the frontend base URL from environment variables or request headers.
 * Strips any trailing slashes to guarantee clean URL construction.
 */
function getFrontendBaseUrl(request: Request): string | null {
  // 1. Check configured environment variables first
  const envFrontendUrl =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.FRONTEND_APP_URL;

  if (envFrontendUrl && typeof envFrontendUrl === "string" && envFrontendUrl.trim()) {
    return envFrontendUrl.trim().replace(/\/+$/, "");
  }

  // 2. Fall back to request Origin header
  const originHeader = request.headers.get("origin");
  if (originHeader && originHeader.trim() && originHeader !== "null") {
    return originHeader.trim().replace(/\/+$/, "");
  }

  // 3. Fall back to request Referer header
  const refererHeader = request.headers.get("referer");
  if (refererHeader && refererHeader.trim()) {
    try {
      const parsedReferer = new URL(refererHeader);
      if (parsedReferer.origin && parsedReferer.origin !== "null") {
        return parsedReferer.origin.replace(/\/+$/, "");
      }
    } catch {
      // Ignore URL parse failures
    }
  }

  return null;
}

// GET /api/invitations - List all invitations for the authenticated trainer
export async function GET(request: Request) {
  try {
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user: trainerUser } = authResult;
    const trainerId = trainerUser.id;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is not configured. Please configure your Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY) to load invitations.",
        },
        { status: 503 }
      );
    }

    const dbClient = supabaseAdmin || supabase;

    // Fetch all invitations created by this trainer (never return token_hash)
    const { data: invitations, error: fetchError } = await dbClient
      .from("client_invitations")
      .select("id, client_email, status, expires_at, accepted_at, created_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching trainer client invitations:", fetchError);
      return NextResponse.json(
        { success: false, message: "Failed to load invitations." },
        { status: 500 }
      );
    }

    const now = new Date();
    const expiredIds: string[] = [];

    // Map and update expired statuses on the fly
    const mappedInvitations = (invitations || []).map((inv) => {
      let currentStatus = inv.status;
      if (currentStatus === "pending" && new Date(inv.expires_at) <= now) {
        currentStatus = "expired";
        expiredIds.push(inv.id);
      }
      return {
        id: inv.id,
        client_email: inv.client_email,
        status: currentStatus,
        expires_at: inv.expires_at,
        accepted_at: inv.accepted_at,
        created_at: inv.created_at,
      };
    });

    // Update expired statuses in DB asynchronously if any were detected
    if (expiredIds.length > 0) {
      dbClient
        .from("client_invitations")
        .update({ status: "expired" })
        .in("id", expiredIds)
        .then(({ error: updateErr }) => {
          if (updateErr) {
            console.error("Error updating expired invitations:", updateErr);
          }
        });
    }

    return NextResponse.json(
      {
        success: true,
        invitations: mappedInvitations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Exception fetching invitations:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while fetching invitations." },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create a new client invitation
export async function POST(request: Request) {
  try {
    // 1. Authenticate and verify role = 'trainer'
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user: trainerUser } = authResult;
    const trainerId = trainerUser.id;

    // 2. Validate Supabase database configuration
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is not configured. Please configure your Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY) to generate and store client invitations.",
        },
        { status: 503 }
      );
    }

    // 3. Resolve frontend base URL
    const frontendBaseUrl = getFrontendBaseUrl(request);
    if (!frontendBaseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to determine frontend base URL for invitation link. Please configure FRONTEND_URL or ensure the request includes an Origin header.",
        },
        { status: 400 }
      );
    }

    // 4. Parse and validate JSON request body
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
    const dbClient = supabaseAdmin || supabase;

    // 5. Check for active duplicate invitation for this trainer and email
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
          message: "An active pending invitation already exists for this email address.",
        },
        { status: 409 }
      );
    }

    // 6. Cryptographically secure token generation and SHA-256 hashing
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 7. Expiration calculation (7 days from creation)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 8. Insert new invitation record into public.client_invitations (storing ONLY token_hash)
    const { data: inserted, error: insertError } = await dbClient
      .from("client_invitations")
      .insert({
        trainer_id: trainerId,
        client_email: clientEmail,
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Error creating client invitation record:", insertError);
      return NextResponse.json(
        { success: false, message: "Failed to create client invitation in database." },
        { status: 500 }
      );
    }

    // 9. Construct cleanly formatted invitation URL using HashRouter format without duplicate slashes
    const inviteUrl = `${frontendBaseUrl}/#/invite?token=${encodeURIComponent(rawToken)}`;

    // 10. Return successful response with the shareable invitation URL
    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: inserted?.id,
          client_email: clientEmail,
          invite_url: inviteUrl,
          expires_at: expiresAt,
          created_at: inserted?.created_at || nowIso,
          status: "pending",
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

// PATCH /api/invitations - Manage/Revoke existing invitation
export async function PATCH(request: Request) {
  try {
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user: trainerUser } = authResult;
    const trainerId = trainerUser.id;

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is not configured. Please configure your Supabase credentials to manage invitations.",
        },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parseResult = patchSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Validation failed.";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    const { id: invitationId, action } = parseResult.data;
    const dbClient = supabaseAdmin || supabase;

    // Verify invitation belongs to trainer
    const { data: invitation, error: checkError } = await dbClient
      .from("client_invitations")
      .select("id, trainer_id, status, expires_at, client_email")
      .eq("id", invitationId)
      .eq("trainer_id", trainerId)
      .maybeSingle();

    if (checkError || !invitation) {
      return NextResponse.json(
        { success: false, message: "Invitation not found or unauthorized." },
        { status: 404 }
      );
    }

    if (action === "revoke") {
      if (invitation.status === "accepted") {
        return NextResponse.json(
          { success: false, message: "Cannot revoke an already accepted invitation." },
          { status: 400 }
        );
      }
      if (invitation.status === "revoked") {
        return NextResponse.json(
          { success: false, message: "This invitation is already revoked." },
          { status: 400 }
        );
      }

      const { error: updateError } = await dbClient
        .from("client_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId)
        .eq("trainer_id", trainerId);

      if (updateError) {
        console.error("Error revoking invitation:", updateError);
        return NextResponse.json(
          { success: false, message: "Failed to revoke invitation." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Invitation successfully revoked." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Unsupported action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Exception in PATCH invitations:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while updating invitation." },
      { status: 500 }
    );
  }
}

