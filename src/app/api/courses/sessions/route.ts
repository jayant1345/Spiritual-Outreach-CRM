import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, sessionDate, sessionTime, venue, completed } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const updated = await prisma.courseSession.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(sessionDate ? { sessionDate: new Date(sessionDate) } : {}),
        ...(sessionTime !== undefined ? { sessionTime: sessionTime.trim() } : {}),
        ...(venue !== undefined ? { venue: venue.trim() } : {}),
        ...(completed !== undefined ? { completed: Boolean(completed) } : {}),
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (error: any) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
