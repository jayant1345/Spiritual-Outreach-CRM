import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSessionToken, AUTH_COOKIE, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { username: identifier.toLowerCase().trim() },
          { phone: identifier.trim() },
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

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role as SessionUser["role"],
      avatar: user.avatar,
      privileges: user.privileges ? JSON.parse(user.privileges) : null,
    };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: `Welcome back, ${user.name}!`,
    });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
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
