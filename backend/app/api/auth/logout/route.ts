import { NextResponse } from "next/server";
import { getRequestClient } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        // Create request-specific client and invoke sign out
        const requestClient = getRequestClient(token);
        const { error: signOutError } = await requestClient.auth.signOut();
        if (signOutError) {
          console.warn("Supabase auth.signOut warning/error:", signOutError.message);
          // We continue and return success because the user session is already invalid/expired
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout API exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
