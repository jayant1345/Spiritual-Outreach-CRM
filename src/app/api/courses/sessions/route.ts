import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const body = await request.json();
    const { batchId, sessionNumber, title, sessionDate, sessionTime, venue } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Determine session number if not provided
    let sNum = Number(sessionNumber);
    if (!sNum) {
      const maxSess = await prisma.courseSession.findFirst({
        where: { batchId },
        orderBy: { sessionNumber: "desc" },
      });
      sNum = (maxSess?.sessionNumber || 0) + 1;
    }

    let parsedDate = new Date();
    if (sessionDate) {
      const [y, m, d] = sessionDate.split("T")[0].split("-").map(Number);
      parsedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }

    const created = await prisma.courseSession.create({
      data: {
        batchId,
        sessionNumber: sNum,
        title: title ? title.trim() : `Session ${sNum}`,
        sessionDate: parsedDate,
        sessionTime: sessionTime ? sessionTime.trim() : "Evening",
        venue: venue ? venue.trim() : "Main Hall, Chandkheda Center",
        completed: false,
      },
    });

    return NextResponse.json({ success: true, session: created }, { status: 201 });
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    let parsedDate: Date | undefined = undefined;
    if (sessionDate) {
      const [y, m, d] = sessionDate.split("T")[0].split("-").map(Number);
      parsedDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }

    const updated = await prisma.courseSession.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(parsedDate ? { sessionDate: parsedDate } : {}),
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

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await prisma.courseSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Session deleted successfully" });
  } catch (error: any) {
    console.error("Session deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

