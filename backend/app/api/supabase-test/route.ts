import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  // 1. Check if the environment variables have been filled in by the user
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection failed: Environment variables are not configured.",
        details: "Please open your backend/.env file and replace 'your_supabase_project_url' and 'your_supabase_publishable_key' with your actual Supabase credentials.",
      },
      { status: 400 }
    );
  }

  try {
    // 2. Perform a test query against a dummy table.
    // We expect this query to fail with a "relation does not exist" error because we haven't created any tables yet.
    // If we receive this specific database schema error, it proves the connection is working perfectly!
    const { error } = await supabase.from("_connection_test").select("*").limit(1);

    if (error) {
      console.log("Supabase connection test query returned error:", error);
      // If the error code is "42P01" (relation does not exist) or "PGRST205" (missing from schema cache),
      // it means the client successfully reached Supabase, authenticated, and queried the database schema cache.
      if (
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.status === 404 ||
        error.message.includes("relation") ||
        error.message.includes("schema cache")
      ) {
        return NextResponse.json({
          success: true,
          message: "BeFit Supabase connection successful",
          details: "Successfully communicated with the Supabase PostgreSQL database.",
        });
      }

      // Check if it failed due to bad/expired API keys (authentication)
      if (error.status === 401) {
        return NextResponse.json(
          {
            success: false,
            message: "Supabase connection failed: Invalid Publishable Key.",
            details: "The API returned a 401 Unauthorized error. Please double-check your publishable key in backend/.env.",
            error_details: error.message,
          },
          { status: 401 }
        );
      }

      // Other database API errors
      return NextResponse.json(
        {
          success: false,
          message: "Supabase connection failed: Query returned an API error.",
          error_details: error.message,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }


    // In the unlikely event that a table named '_connection_test' actually exists and returns success:
    return NextResponse.json({
      success: true,
      message: "BeFit Supabase connection successful",
    });
  } catch (err: any) {
    console.error("Supabase connection test exception caught:", err);
    // Catch-all for network errors (e.g. wrong URL, no internet)
    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection failed: Network error.",
        details: "Failed to connect to the Supabase URL. Please check your internet connection and verify that your NEXT_PUBLIC_SUPABASE_URL is correct in backend/.env.",
        error_details: err.message || err,
      },
      { status: 500 }
    );
  }
}
