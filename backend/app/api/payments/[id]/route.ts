import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUS = ["pending", "paid", "overdue", "expired"];
const ALLOWED_METHODS = ["cash", "upi", "card", "bank_transfer"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id: paymentId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(paymentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;

    // 3. Find payment log details
    const dbClient = supabaseAdmin || supabase;
    const { data: payment, error: findError } = await dbClient
      .from("payments")
      .select("*, client:profiles!client_id(id, full_name, email)")
      .eq("id", paymentId)
      .single();

    if (findError || !payment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found." },
        { status: 404 }
      );
    }

    // 4. Verify Authorization
    if (role === "client") {
      if (payment.client_id !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
    } else if (role === "trainer") {
      const assigned = await isAssignedClient(user.id, payment.client_id);
      if (!assigned) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden. Unknown role." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment record retrieved successfully",
        data: {
          payment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/payments/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: paymentId } = await context.params;

    // 1. Validate UUID format
    if (!UUID_REGEX.test(paymentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment ID format." },
        { status: 400 }
      );
    }

    // 2. Enforce Trainer role authentication
    const authResult = await requireTrainer(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // 3. Find payment details
    const dbClient = supabaseAdmin || supabase;
    const { data: payment, error: findError } = await dbClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (findError || !payment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found." },
        { status: 404 }
      );
    }

    // 4. Verify trainer is assigned to the client
    const assigned = await isAssignedClient(user.id, payment.client_id);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. Access is denied because this client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Parse request body and validate update fields
    const body = await request.json();
    
    // Prohibit changing client_id or id
    if (body.client_id !== undefined || body.id !== undefined) {
      return NextResponse.json(
        { success: false, message: "Modifying record identity/ownership fields is prohibited." },
        { status: 400 }
      );
    }

    const allowedFields = [
      "amount",
      "payment_date",
      "due_date",
      "membership_start",
      "membership_end",
      "status",
      "payment_method",
      "transaction_id",
      "notes",
    ];

    const updatePayload: Record<string, unknown> = {};
    let hasUpdates = false;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return NextResponse.json(
        { success: false, message: "No fields provided for update." },
        { status: 400 }
      );
    }

    // Validate inputs
    if (updatePayload.amount !== undefined && (typeof updatePayload.amount !== "number" || updatePayload.amount <= 0)) {
      return NextResponse.json(
        { success: false, message: "Amount must be a positive number." },
        { status: 400 }
      );
    }

    const dateFields = ["due_date", "membership_start", "membership_end"];
    for (const d of dateFields) {
      if (updatePayload[d] !== undefined && (typeof updatePayload[d] !== "string" || !DATE_REGEX.test(updatePayload[d] as string))) {
        return NextResponse.json(
          { success: false, message: `${d.replace("_", " ")} must be in YYYY-MM-DD format.` },
          { status: 400 }
        );
      }
    }

    if (updatePayload.status !== undefined && !ALLOWED_STATUS.includes(updatePayload.status as string)) {
      return NextResponse.json(
        { success: false, message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}` },
        { status: 400 }
      );
    }

    if (updatePayload.payment_method !== undefined && updatePayload.payment_method !== null && !ALLOWED_METHODS.includes(updatePayload.payment_method as string)) {
      return NextResponse.json(
        { success: false, message: `Payment method must be one of: ${ALLOWED_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    // Check conflict if changing transaction_id
    if (updatePayload.transaction_id !== undefined && updatePayload.transaction_id !== null) {
      const cleanTx = (updatePayload.transaction_id as string).trim();
      if (cleanTx && cleanTx !== payment.transaction_id) {
        const { data: duplicateTx, error: dupError } = await dbClient
          .from("payments")
          .select("id")
          .eq("transaction_id", cleanTx)
          .maybeSingle();

        if (!dupError && duplicateTx) {
          return NextResponse.json(
            { success: false, message: "Transaction ID already exists." },
            { status: 409 }
          );
        }
      }
      updatePayload.transaction_id = cleanTx || null;
    }

    if (updatePayload.amount !== undefined) updatePayload.amount = Number(updatePayload.amount);

    // 6. Update database under RLS
    const requestClient = getRequestClient(token);
    const { data: updatedPayment, error: updateError } = await requestClient
      .from("payments")
      .update(updatePayload)
      .eq("id", paymentId)
      .select()
      .single();

    if (updateError) {
      console.error("Payment update failed:", updateError.message);
      return NextResponse.json(
        { success: false, message: "Failed to update payment record: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment record updated successfully",
        data: {
          payment: updatedPayment,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/payments/[id] exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
