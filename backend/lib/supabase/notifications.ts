import { supabase, supabaseAdmin } from "./client";

export type NotificationType = "payment" | "workout" | "diet" | "attendance" | "general";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Safely creates a notification for a user.
 * Includes deduplication logic: if an unread notification with the same user_id, title, and type
 * was created within the last 15 minutes, the duplicate is safely skipped.
 * Exceptions are caught and logged so parent transactions are never aborted.
 */
export async function createSafeNotification({
  userId,
  title,
  message,
  type,
}: CreateNotificationParams): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const dbClient = supabaseAdmin || supabase;
    const cleanUserId = userId?.trim();
    const cleanTitle = title?.trim();
    const cleanMessage = message?.trim();

    if (!cleanUserId || !cleanTitle || !cleanMessage || !type) {
      return { success: false, error: "Missing required notification fields." };
    }

    // Deduplication check: look for identical unread notification created in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentDuplicate, error: checkError } = await dbClient
      .from("notifications")
      .select("id")
      .eq("user_id", cleanUserId)
      .eq("title", cleanTitle)
      .eq("type", type)
      .eq("is_read", false)
      .gte("created_at", fifteenMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (!checkError && recentDuplicate) {
      // Duplicate found within 15 minutes, safely skip creating another
      return { success: true, skipped: true };
    }

    const { error: insertError } = await dbClient
      .from("notifications")
      .insert({
        user_id: cleanUserId,
        title: cleanTitle,
        message: cleanMessage,
        type,
        is_read: false,
      });

    if (insertError) {
      console.error("Failed to insert notification:", insertError.message);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected exception in createSafeNotification:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Event Helper: Payment Recorded / Confirmed
 * Notifies the Client of receipt and the Trainer of payment collection.
 */
export async function notifyPaymentRecorded({
  clientId,
  clientName,
  amount,
  notes,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  amount: number;
  notes?: string;
  trainerId?: string;
}) {
  const formattedAmount = Number(amount).toLocaleString("en-IN");
  const details = notes ? ` for ${notes}` : "";

  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "Payment Recorded",
    message: `A payment of ₹${formattedAmount}${details} has been recorded for your gym account.`,
    type: "payment",
  });

  // 2. Notify Trainer if trainerId is present
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Payment Confirmed",
      message: `Payment of ₹${formattedAmount} confirmed for ${targetName}.`,
      type: "payment",
    });
  }
}

/**
 * Event Helper: Payment Overdue
 * Notifies the Client of overdue payment and alerts the Trainer.
 */
export async function notifyPaymentOverdue({
  clientId,
  clientName,
  amount,
  dueDate,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  amount: number;
  dueDate: string;
  trainerId?: string;
}) {
  const formattedAmount = Number(amount).toLocaleString("en-IN");

  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "Payment Overdue Alert",
    message: `Your membership fee of ₹${formattedAmount} was due on ${dueDate}. Please complete renewal.`,
    type: "payment",
  });

  // 2. Notify Trainer
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Client Payment Overdue",
      message: `Membership payment of ₹${formattedAmount} for ${targetName} is overdue (Due: ${dueDate}).`,
      type: "payment",
    });
  }
}

/**
 * Event Helper: Workout Plan Created
 */
export async function notifyWorkoutPlanCreated({
  clientId,
  clientName,
  planName,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  planName: string;
  trainerId?: string;
}) {
  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "New Workout Plan Assigned",
    message: `Your trainer assigned a new workout plan: "${planName}". Check your routines!`,
    type: "workout",
  });

  // 2. Notify Trainer
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Workout Plan Created",
      message: `Assigned workout plan "${planName}" to ${targetName}.`,
      type: "workout",
    });
  }
}

/**
 * Event Helper: Workout Plan Updated
 */
export async function notifyWorkoutPlanUpdated({
  clientId,
  clientName,
  planName,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  planName: string;
  trainerId?: string;
}) {
  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "Workout Plan Updated",
    message: `Your workout plan "${planName}" has been updated. Review your routine changes.`,
    type: "workout",
  });

  // 2. Notify Trainer
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Workout Plan Updated",
      message: `Updated workout plan "${planName}" for ${targetName}.`,
      type: "workout",
    });
  }
}

/**
 * Event Helper: Diet Plan Created
 */
export async function notifyDietPlanCreated({
  clientId,
  clientName,
  planName,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  planName: string;
  trainerId?: string;
}) {
  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "New Diet Plan Assigned",
    message: `Your trainer assigned a new nutrition plan: "${planName}". Check your meal targets!`,
    type: "diet",
  });

  // 2. Notify Trainer
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Diet Plan Created",
      message: `Assigned diet plan "${planName}" to ${targetName}.`,
      type: "diet",
    });
  }
}

/**
 * Event Helper: Diet Plan Updated
 */
export async function notifyDietPlanUpdated({
  clientId,
  clientName,
  planName,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  planName: string;
  trainerId?: string;
}) {
  // 1. Notify Client
  await createSafeNotification({
    userId: clientId,
    title: "Diet Plan Updated",
    message: `Your diet plan "${planName}" has been updated. Check your revised meal plan.`,
    type: "diet",
  });

  // 2. Notify Trainer
  if (trainerId) {
    const targetName = clientName || "Client";
    await createSafeNotification({
      userId: trainerId,
      title: "Diet Plan Updated",
      message: `Updated diet plan "${planName}" for ${targetName}.`,
      type: "diet",
    });
  }
}

/**
 * Event Helper: Attendance Logged
 */
export async function notifyAttendanceLogged({
  clientId,
  clientName,
  date,
  status,
  trainerId,
}: {
  clientId: string;
  clientName?: string;
  date: string;
  status: "present" | "absent";
  trainerId?: string;
}) {
  if (status === "present") {
    // 1. Notify Client
    await createSafeNotification({
      userId: clientId,
      title: "Attendance Check-In Logged",
      message: `Your gym check-in for ${date} has been confirmed. Great workout!`,
      type: "attendance",
    });

    // 2. Notify Trainer
    if (trainerId) {
      const targetName = clientName || "Client";
      await createSafeNotification({
        userId: trainerId,
        title: "Client Checked In",
        message: `${targetName} was checked in on ${date}.`,
        type: "attendance",
      });
    }
  } else {
    // Absent status notification
    await createSafeNotification({
      userId: clientId,
      title: "Attendance Notice",
      message: `You were marked absent on ${date}. Consistency is key to reaching your goals!`,
      type: "attendance",
    });
  }
}
