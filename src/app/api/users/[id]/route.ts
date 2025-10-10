import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateToken, checkRole } from "@/lib/auth-middleware";
import bcrypt from "bcryptjs";

// Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user: currentUser } = authResult;
    const { id } = await params;

    // Users can view their own profile, or admins/managers can view any profile
    if (
      currentUser!.id !== id &&
      !checkRole(currentUser!.role, ["ADMIN", "MANAGER"])
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const user = (await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    } as any)) as any;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate token and get user
    const authResult = await validateToken(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { user: currentUser } = authResult;

    // Check if user has permission (Admin or Manager, or updating own profile)
    const { id } = await params;
    const isOwnProfile = currentUser!.id === id;
    const hasAdminAccess = checkRole(currentUser!.role, ["ADMIN", "MANAGER"]);

    if (!isOwnProfile && !hasAdminAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { name, email, role, password, currentPassword } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = (await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    } as any)) as any;

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user (if provided)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: id }, // Exclude current user
        },
      } as any);

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = { name };
    if (email !== undefined) {
      updateData.email = email;
    }

    // Only admins can change roles
    if (
      role &&
      role !== existingUser.role &&
      checkRole(currentUser!.role, ["ADMIN"])
    ) {
      updateData.role = role;
    } else if (
      role &&
      role !== existingUser.role &&
      !checkRole(currentUser!.role, ["ADMIN"])
    ) {
      return NextResponse.json(
        { error: "Only administrators can change user roles" },
        { status: 403 }
      );
    }

    // Password update with current password validation
    if (password) {
      // For own profile, require current password validation
      if (isOwnProfile) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to change password" },
            { status: 400 }
          );
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
        if (!isCurrentPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      // Validate new password strength
      if (password.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = (await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
      },
    } as any)) as any;

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const actorId = user!.id;

    // Check if user has permission (Admin only)
    if (!checkRole(user!.role, ["ADMIN"])) {
      return NextResponse.json(
        { error: "Only administrators can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (user!.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (checkRole(existingUser.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { error: "Administrative accounts cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.userShopRole.deleteMany({ where: { userId: id } });
      await tx.organizationMember.deleteMany({ where: { userId: id } });
      await tx.shopGroupMember.deleteMany({ where: { userId: id } });
  await tx.schedulerConfig.updateMany({ where: { updatedBy: id }, data: { updatedBy: null } });
      await tx.schedulerJob.updateMany({ where: { createdBy: id }, data: { createdBy: actorId } });
      await tx.user.updateMany({ where: { createdBy: id }, data: { createdBy: null } });
      await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.shopGroup.updateMany({ where: { managerId: id }, data: { managerId: actorId } });

      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}