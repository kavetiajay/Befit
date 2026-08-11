import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  try {
    const authUserInfo = await getAuthenticatedUser(request);

    if (!authUserInfo) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Session is invalid or has expired." },
        { status: 401 }
      );
    }

    const { user, profile, role } = authUserInfo;

    return NextResponse.json(
      {
        success: true,
        message: "Session is valid",
        data: {
          user: {
            id: user.id,
            email: user.email,
            emailConfirmedAt: user.email_confirmed_at,
          },
          profile,
          role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Session API exception caught:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while verifying session." },
      { status: 500 }
    );
  }
}
