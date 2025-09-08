import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";

// Get all users (Admin and Manager only)
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission (Admin or Manager only)
    if (!["ADMIN", "MANAGER"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Role-based filtering
    if (!["ADMIN", "MANAGER"].includes(currentUser.role)) {
      // Non-admin users can only see users they created or themselves
      where.OR = [
        { id: currentUser.id },
        { createdBy: currentUser.id },
      ];
    }

    // Get paginated users without shop relations first
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        // Include creator information
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count
    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Manually fetch user shop roles with proper error handling
    const usersWithShopRoles = await Promise.all(
      users.map(async (user) => {
        try {
          // Get user shop roles separately
          const userShopRoles = await prisma.userShopRole.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              role: true,
              shopId: true,
            },
          });

          // For each role, try to get the shop data
          const rolesWithShops = await Promise.all(
            userShopRoles.map(async (role) => {
              try {
                const shop = await prisma.shopAuthorization.findUnique({
                  where: { id: role.shopId },
                  select: {
                    id: true,
                    shopId: true,
                    shopName: true,
                    status: true,
                    app: {
                      select: {
                        channel: true,
                        appName: true,
                      },
                    },
                  },
                });

                return {
                  id: role.id,
                  role: role.role,
                  shop:
                    shop !== null
                      ? {
                          ...shop,
                          channelName: shop.app?.channel || "UNKNOWN",
                          appName: shop.app?.appName || "Unknown App",
                        }
                      : null,
                };
              } catch (error) {
                console.warn(
                  `Could not fetch shop for role ${role.id}:`,
                  error
                );
                return {
                  id: role.id,
                  role: role.role,
                  shop: null,
                };
              }
            })
          );

          // Filter out roles with null shops
          const validRoles = rolesWithShops.filter((role) => role.shop !== null);

          return {
            ...user,
            userShopRoles: validRoles,
          };
        } catch (error) {
          console.warn(`Could not fetch shop roles for user ${user.id}:`, error);
          return {
            ...user,
            userShopRoles: [],
          };
        }
      })
    );

    return NextResponse.json({
      users: usersWithShopRoles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has permission (Admin only)
    if (!["ADMIN"].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can create users" },
        { status: 403 }
      );
    }

    const { name, username, role, password } = await request.json();

    if (!name || !username || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        role,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}