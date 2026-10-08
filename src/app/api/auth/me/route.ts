import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createSessionToken, AUTH_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const response = NextResponse.json({
      authenticated: true,
      user,
    });

    // Refresh persistent cookie so PWA & browser session remains active
    const token = createSessionToken(user);
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
