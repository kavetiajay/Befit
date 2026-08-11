import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireTrainer, getRequestClient, isAssignedClient } from "@/lib/supabase/auth";
import { supabase, supabaseAdmin } from "@/lib/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUS = ["pending", "paid", "overdue", "expired"];
const ALLOWED_METHODS = ["cash", "upi", "card", "bank_transfer"];

export async function GET(request: Request) {
  try {
    // 1. Enforce authentication
    const authResult = await requireAuthenticatedUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, role } = authResult;
    const authHeader = request.headers.get("Authorization")!;
    const token = authHeader.substring(7).trim();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("clientId") || searchParams.get("client_id");

    const requestClient = getRequestClient(token);
    let query = requestClient.from("payments").select("*, client:profiles!client_id(id, full_name, email)");

    // Authorization & filtering
    if (role === "client") {
      if (clientIdParam && clientIdParam !== user.id) {
        return NextResponse.json(
          { success: false, message: "Forbidden. Access is denied." },
          { status: 403 }
        );
      }
      query = query.eq("client_id", user.id);
    } else if (role === "trainer") {
      if (clientIdParam) {
        if (!UUID_REGEX.test(clientIdParam)) {
          return NextResponse.json(
            { success: false, message: "Invalid client ID format." },
            { status: 400 }
          );
        }

        const assigned = await isAssignedClient(user.id, clientIdParam);
        if (!assigned) {
          return NextResponse.json(
            { success: false, message: "Forbidden. This client is not assigned to you." },
            { status: 403 }
          );
        }
        query = query.eq("client_id", clientIdParam);
      } else {
        // Retrieve trainer-assigned clients list
        const { data: assignments, error: assignError } = await requestClient
          .from("trainer_client")
          .select("client_id")
          .eq("trainer_id", user.id);

        if (assignError) {
          console.error("Trainer clients lookup error:", assignError.message);
          return NextResponse.json(
            { success: false, message: "Failed to retrieve assigned client list." },
            { status: 500 }
          );
        }

        const clientIds = (assignments || []).map((a) => a.client_id);
        if (clientIds.length === 0) {
          return NextResponse.json(
            {
              success: true,
              message: "Payments retrieved successfully",
              data: { payments: [] },
            },
            { status: 200 }
          );
        }
        query = query.in("client_id", clientIds);
      }
    }

    const { data: payments, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error retrieving payments:", error.message);
      return NextResponse.json(
        { success: false, message: "Failed to retrieve payment records." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payments retrieved successfully",
        data: {
          payments,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/payments exception caught:", error);
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
    const {
      client_id: clientId,
      amount,
      payment_date,
      due_date,
      membership_start,
      membership_end,
      status,
      payment_method,
      transaction_id,
      notes,
    } = body;

    // Validation
    if (!clientId || typeof clientId !== "string" || !UUID_REGEX.test(clientId)) {
      return NextResponse.json(
        { success: false, message: "A valid client ID (UUID) is required." },
        { status: 400 }
      );
    }
    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a positive number." },
        { status: 400 }
      );
    }
    if (!due_date || typeof due_date !== "string" || !DATE_REGEX.test(due_date)) {
      return NextResponse.json(
        { success: false, message: "Due date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }
    if (!membership_start || typeof membership_start !== "string" || !DATE_REGEX.test(membership_start)) {
      return NextResponse.json(
        { success: false, message: "Membership start date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }
    if (!membership_end || typeof membership_end !== "string" || !DATE_REGEX.test(membership_end)) {
      return NextResponse.json(
        { success: false, message: "Membership end date in YYYY-MM-DD format is required." },
        { status: 400 }
      );
    }
    if (!status || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}` },
        { status: 400 }
      );
    }
    if (payment_method && !ALLOWED_METHODS.includes(payment_method)) {
      return NextResponse.json(
        { success: false, message: `Payment method must be one of: ${ALLOWED_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Verify client exists and has client role
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
        { success: false, message: "Cannot issue invoice to a non-client user." },
        { status: 400 }
      );
    }

    // 4. Verify trainer is assigned to this client
    const assigned = await isAssignedClient(user.id, clientId);
    if (!assigned) {
      return NextResponse.json(
        { success: false, message: "Forbidden. This client is not assigned to you." },
        { status: 403 }
      );
    }

    // 5. Check for duplicate transaction ID
    if (transaction_id && typeof transaction_id === "string" && transaction_id.trim()) {
      const { data: duplicateTx, error: findError } = await dbClient
        .from("payments")
        .select("id")
        .eq("transaction_id", transaction_id.trim())
        .maybeSingle();

      if (!findError && duplicateTx) {
        return NextResponse.json(
          { success: false, message: "Transaction ID already exists." },
          { status: 409 }
        );
      }
    }

    // 6. Insert payment record
    const requestClient = getRequestClient(token);
    const paymentPayload = {
      client_id: clientId,
      amount: Number(amount),
      payment_date: payment_date || null,
      due_date,
      membership_start,
      membership_end,
      status,
      payment_method: payment_method || null,
      transaction_id: transaction_id ? transaction_id.trim() : null,
      notes: notes || null,
    };

    const { data: newPayment, error: insertError } = await requestClient
      .from("payments")
      .insert(paymentPayload)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create payment log:", insertError.message);
      return NextResponse.json(
        { success: false, message: "Failed to record payment: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment record created successfully",
        data: {
          payment: newPayment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/payments exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving payment." },
      { status: 500 }
    );
  }
}
