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
    const {
      courseId,
      batchName,
      startDate,
      scheduleInfo,
      venue,
      maxCapacity,
      totalSessions,
    } = body;

    if (!courseId || !batchName) {
      return NextResponse.json({ error: "Course ID and Batch Name are required" }, { status: 400 });
    }

    const batch = await prisma.courseBatch.create({
      data: {
        courseId,
        batchName,
        startDate: startDate ? new Date(startDate) : new Date(),
        scheduleInfo: scheduleInfo || "Weekly Session",
      },
    });

    const sessionsCount = Number(totalSessions) || 8;
    const sDate = startDate ? new Date(startDate) : new Date();

    for (let i = 1; i <= sessionsCount; i++) {
      const sessionDate = new Date(sDate.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
      await prisma.courseSession.create({
        data: {
          batchId: batch.id,
          sessionNumber: i,
          title: `Session ${i}`,
          sessionDate,
          sessionTime: scheduleInfo || "Evening",
          completed: false,
        },
      });
    }

    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (error: any) {
    console.error("Batch creation error:", error);
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
    const { id, batchName, scheduleInfo, startDate, active, syncSessionDates = true, sessions } = body;

    if (!id) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    const updated = await prisma.courseBatch.update({
      where: { id },
      data: {
        ...(batchName ? { batchName: batchName.trim() } : {}),
        ...(scheduleInfo !== undefined ? { scheduleInfo: scheduleInfo.trim() } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    // Handle individual session overrides if provided
    if (Array.isArray(sessions) && sessions.length > 0) {
      for (const s of sessions) {
        if (s.id) {
          await prisma.courseSession.update({
            where: { id: s.id },
            data: {
              ...(s.sessionDate ? { sessionDate: new Date(s.sessionDate) } : {}),
              ...(s.sessionTime !== undefined ? { sessionTime: s.sessionTime } : {}),
              ...(s.title !== undefined ? { title: s.title } : {}),
              ...(s.completed !== undefined ? { completed: Boolean(s.completed) } : {}),
            },
          });
        }
      }
    } else if (startDate && syncSessionDates) {
      // Automatically recalculate all session dates based on the new batch startDate (+7 days weekly)
      const parsedStartDate = new Date(startDate);
      const existingSessions = await prisma.courseSession.findMany({
        where: { batchId: id },
        orderBy: { sessionNumber: "asc" },
      });

      for (const sess of existingSessions) {
        // Session 1 is on startDate, Session 2 is startDate + 7 days, Session 3 is startDate + 14 days, etc.
        const newSessionDate = new Date(
          parsedStartDate.getTime() + (sess.sessionNumber - 1) * 7 * 24 * 60 * 60 * 1000
        );
        await prisma.courseSession.update({
          where: { id: sess.id },
          data: {
            sessionDate: newSessionDate,
            ...(scheduleInfo ? { sessionTime: scheduleInfo } : {}),
          },
        });
      }
    }

    // Return the updated batch with refreshed sessions
    const refreshedBatch = await prisma.courseBatch.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { sessionNumber: "asc" } },
      },
    });

    return NextResponse.json({ success: true, batch: refreshedBatch });
  } catch (error: any) {
    console.error("Batch update error:", error);
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
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    await prisma.courseBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Batch deleted successfully" });
  } catch (error: any) {
    console.error("Batch deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
