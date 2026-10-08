import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE, SessionUser, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { getEffectivePermissions } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required" },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.toLowerCase().trim();
    const rawTrimmed = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
          { phone: rawTrimmed },
        ],
        active: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your username/email and password." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials. Incorrect password." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const parsedPrivileges = user.privileges ? JSON.parse(user.privileges) : null;
    const permissions = getEffectivePermissions(user.role, parsedPrivileges);

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role as SessionUser["role"],
      avatar: user.avatar,
      privileges: parsedPrivileges,
      permissions,
    };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      token,
      message: `Welcome back, ${user.name}!`,
    });

    // Persistent cookie for browser & PWA
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
