import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    return NextResponse.json({
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
      },
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}