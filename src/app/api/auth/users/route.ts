import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getEffectivePermissions, hasPermission } from "@/lib/permissions";

// GET all users (Admin & Coordinator with users:manage permission)
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Unauthorized. User management access required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        privileges: true,
        active: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            assignedPeople: true,
            relationshipPeople: true,
            callLogs: true,
            followups: true,
          },
        },
      },
    });

    const formattedUsers = users.map((u) => {
      const parsedPrivileges: string[] | null = u.privileges ? JSON.parse(u.privileges) : null;
      const permissions = getEffectivePermissions(u.role, parsedPrivileges);
      return {
        ...u,
        privileges: parsedPrivileges,
        permissions,
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST create new user
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Unauthorized. User management access required." }, { status: 403 });
    }

    const { name, username, email, phone, role, password, privileges } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Only Super Admin can create another Super Admin
    if (role === "SUPER_ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only a Super Admin can create another Super Admin account." }, { status: 403 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingEmail) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase().trim() } });
      if (existingUsername) {
        return NextResponse.json({ error: "This username is already taken" }, { status: 400 });
      }
    }

    // Generate initials for avatar
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 3);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username ? username.toLowerCase().trim() : null,
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        role: role || "CALLING_VOLUNTEER",
        privileges: privileges && Array.isArray(privileges) ? JSON.stringify(privileges) : null,
        passwordHash: hashPassword(password),
        avatar: initials,
        active: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        privileges: true,
        avatar: true,
        active: true,
      },
    });

    const parsedPrivileges: string[] | null = newUser.privileges ? JSON.parse(newUser.privileges) : null;
    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        privileges: parsedPrivileges,
        permissions: getEffectivePermissions(newUser.role, parsedPrivileges),
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PATCH update user (role, active status, reset password, privileges)
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Unauthorized. User management access required." }, { status: 403 });
    }

    const { id, role, active, newPassword, privileges } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protection: only Super Admin can alter a Super Admin's details or elevate someone to Super Admin
    if ((targetUser.role === "SUPER_ADMIN" || role === "SUPER_ADMIN") && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only a Super Admin can modify or assign the Super Admin role." }, { status: 403 });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (newPassword) updateData.passwordHash = hashPassword(newPassword);
    if (privileges !== undefined) {
      updateData.privileges = privileges && Array.isArray(privileges) ? JSON.stringify(privileges) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        role: true,
        privileges: true,
        active: true,
      },
    });

    const parsedPrivileges: string[] | null = updatedUser.privileges ? JSON.parse(updatedUser.privileges) : null;
    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        privileges: parsedPrivileges,
        permissions: getEffectivePermissions(updatedUser.role, parsedPrivileges),
      },
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Only Super Admin can delete users." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
