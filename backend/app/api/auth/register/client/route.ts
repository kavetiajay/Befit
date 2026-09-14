import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Direct client registration is disabled. Client accounts can only be created via a valid trainer invitation link.",
    },
    { status: 403 }
  );
}
