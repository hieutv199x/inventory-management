import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole } from "@prisma/client";
import { verifyToken } from "@/utils/auth";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

export async function authenticateUser(request: NextRequest) {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.replace("Bearer ", "");

  // If no Authorization header, try to get token from cookies
  if (!token) {
    token = request.cookies.get("session_id")?.value;
  }

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  };
}

export function requireRole(roles: UserRole[], handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  };
}
