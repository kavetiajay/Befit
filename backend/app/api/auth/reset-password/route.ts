import { NextResponse } from "next/server";
import { getRequestClient } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Session is missing or invalid." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Recovery token is empty." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    // 1. Validate password input
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 2. Initialize request-specific Supabase client and perform update
    const requestClient = getRequestClient(token);
    const { error: updateError } = await requestClient.auth.updateUser({
      password,
    });

    if (updateError) {
      console.warn("Password reset update error:", updateError.message);
      
      // Determine user-friendly messages for standard error codes
      let message = "Failed to reset password. The recovery link may have expired or is invalid.";
      if (updateError.message.includes("same password") || updateError.message.includes("new password")) {
        message = "New password cannot be the same as the old password.";
      } else if (updateError.message.includes("weak")) {
        message = "Password is too weak. Please use a stronger password.";
      }
      
      return NextResponse.json(
        { success: false, message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
