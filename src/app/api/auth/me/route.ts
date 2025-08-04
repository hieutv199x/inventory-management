import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/middleware/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Return user data directly
    return NextResponse.json(user);
  } catch (error) {
    console.error("Me route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
