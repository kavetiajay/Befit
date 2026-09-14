import { NextResponse } from "next/server";
import {
  requireAuthenticatedUser,
  getRequestClient,
} from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";



// Passthrough helper (CORS is handled globally by middleware)
const withCors = (response: NextResponse, ...args: unknown[]) => {
  void args;
  return response;
};

// Helper to validate UUID format
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ================================
// GET CLIENT PROFILE
// ================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;

    // 1. Validate UUID
    if (!UUID_REGEX.test(clientId)) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Invalid client ID format.",
          },
          { status: 400 }
        ),
        request
      );
    }

    // 2. Authentication
    const authResult = await requireAuthenticatedUser(request);

    if (authResult instanceof NextResponse) {
      return withCors(authResult, request);
    }

    const { user, role: userRole } = authResult;

    // 3. Find target profile
    const dbClient = supabaseAdmin || supabase;

    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select(
        "id, full_name, email, phone, dob, gender, address, emergency_contact, profile_image_url, role, goal, height, medical_conditions, allergies, injuries, created_at, updated_at"
      )
      .eq("id", clientId)
      .single();

    if (profileError || !targetProfile) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Client not found.",
          },
          { status: 404 }
        ),
        request
      );
    }

    // 4. Authorization
    if (userRole === "client") {
      // Client can only see their own profile
      if (user.id !== clientId) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: "Forbidden. Access is denied.",
            },
            { status: 403 }
          ),
          request
        );
      }
    } else if (userRole === "trainer") {
      // Trainer can only access assigned clients
      if (targetProfile.role !== "client") {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: "Forbidden. Cannot access non-client account.",
            },
            { status: 403 }
          ),
          request
        );
      }

      const { data: assignment, error: assignError } = await dbClient
        .from("trainer_client")
        .select("id")
        .eq("client_id", clientId)
        .eq("trainer_id", user.id)
        .single();

      if (assignError || !assignment) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message:
                "Forbidden. Access is denied because this client is not assigned to you.",
            },
            { status: 403 }
          ),
          request
        );
      }
    } else {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Forbidden. Unknown role.",
          },
          { status: 403 }
        ),
        request
      );
    }

    // 5. Success
    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Client retrieved successfully",
          data: {
            client: targetProfile,
          },
        },
        { status: 200 }
      ),
      request
    );
  } catch (error) {
    console.error("GET /api/clients/[id] exception caught:", error);

    return withCors(
      NextResponse.json(
        {
          success: false,
          message:
            "An unexpected error occurred while processing your request.",
        },
        { status: 500 }
      ),
      request
    );
  }
}

// ================================
// UPDATE CLIENT PROFILE
// ================================
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: clientId } = await context.params;

    // 1. Validate UUID
    if (!UUID_REGEX.test(clientId)) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Invalid client ID format.",
          },
          { status: 400 }
        ),
        request
      );
    }

    // 2. Authentication
    const authResult = await requireAuthenticatedUser(request);

    if (authResult instanceof NextResponse) {
      return withCors(authResult, request);
    }

    const { user, role: userRole } = authResult;

    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Authorization token is required.",
          },
          { status: 401 }
        ),
        request
      );
    }

    const token = authHeader.substring(7).trim();

    // 3. Find target profile
    const dbClient = supabaseAdmin || supabase;

    const { data: targetProfile, error: profileError } = await dbClient
      .from("profiles")
      .select("id, role")
      .eq("id", clientId)
      .single();

    if (profileError || !targetProfile) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Client not found.",
          },
          { status: 404 }
        ),
        request
      );
    }

    // 4. Authorization
    if (userRole === "client") {
      // Client can only update own profile
      if (user.id !== clientId) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: "Forbidden. Access is denied.",
            },
            { status: 403 }
          ),
          request
        );
      }
    } else if (userRole === "trainer") {
      // Trainer can only update assigned clients
      if (targetProfile.role !== "client") {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: "Forbidden. Cannot update non-client accounts.",
            },
            { status: 403 }
          ),
          request
        );
      }

      const { data: assignment, error: assignError } = await dbClient
        .from("trainer_client")
        .select("id")
        .eq("client_id", clientId)
        .eq("trainer_id", user.id)
        .single();

      if (assignError || !assignment) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message:
                "Forbidden. Access is denied because this client is not assigned to you.",
            },
            { status: 403 }
          ),
          request
        );
      }
    } else {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Forbidden. Unknown role.",
          },
          { status: 403 }
        ),
        request
      );
    }

    // 5. Parse request body
    const body = await request.json();

    // Security fields that cannot be changed
    const forbiddenFields = [
      "id",
      "role",
      "email",
      "created_at",
      "updated_at",
    ];

    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        return withCors(
          NextResponse.json(
            {
              success: false,
              message: `Updating security field '${field}' is prohibited.`,
            },
            { status: 400 }
          ),
          request
        );
      }
    }

    // Fields that can be updated
    const allowedFields = [
      "full_name",
      "phone",
      "dob",
      "gender",
      "address",
      "emergency_contact",
      "profile_image_url",
    ];

    const updatePayload: Record<string, unknown> = {};
    let hasAllowedUpdates = false;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
        hasAllowedUpdates = true;
      }
    }

    if (!hasAllowedUpdates) {
      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "No valid profile fields provided for update.",
          },
          { status: 400 }
        ),
        request
      );
    }

    // 6. Update profile
    const requestClient = getRequestClient(token);

    const { data: updatedProfile, error: updateError } = await requestClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", clientId)
      .select(
        "id, full_name, email, phone, dob, gender, address, emergency_contact, profile_image_url, role, created_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("Profile update failed:", updateError.message);

      return withCors(
        NextResponse.json(
          {
            success: false,
            message: "Failed to update profile: " + updateError.message,
          },
          { status: 500 }
        ),
        request
      );
    }

    // 7. Success
    return withCors(
      NextResponse.json(
        {
          success: true,
          message: "Profile updated successfully.",
          data: {
            client: updatedProfile,
          },
        },
        { status: 200 }
      ),
      request
    );
  } catch (error) {
    console.error("PATCH /api/clients/[id] exception caught:", error);

    return withCors(
      NextResponse.json(
        {
          success: false,
          message:
            "An unexpected error occurred while processing your request.",
        },
        { status: 500 }
      ),
      request
    );
  }
}