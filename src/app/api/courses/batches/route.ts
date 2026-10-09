import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

function parseUtcDate(dateStr?: string | Date): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).split("T")[0];
  const parts = str.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

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
      totalSessions,
      sessions,
    } = body;

    if (!courseId || !batchName) {
      return NextResponse.json({ error: "Course ID and Batch Name are required" }, { status: 400 });
    }

    const parsedStartDate = parseUtcDate(startDate);

    const batch = await prisma.courseBatch.create({
      data: {
        courseId,
        batchName: batchName.trim(),
        startDate: parsedStartDate,
        scheduleInfo: scheduleInfo ? scheduleInfo.trim() : "Weekly Session",
      },
    });

    // If custom sessions were provided from modal customization
    if (Array.isArray(sessions) && sessions.length > 0) {
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        const sDate = s.sessionDate ? parseUtcDate(s.sessionDate) : new Date(parsedStartDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        await prisma.courseSession.create({
          data: {
            batchId: batch.id,
            sessionNumber: Number(s.sessionNumber) || i + 1,
            title: s.title ? s.title.trim() : `Session ${i + 1}`,
            sessionDate: sDate,
            sessionTime: s.sessionTime ? s.sessionTime.trim() : (scheduleInfo || "Evening"),
            completed: false,
          },
        });
      }
    } else {
      const sessionsCount = Number(totalSessions) || 8;
      const [y, m, d] = (startDate ? String(startDate).split("T")[0] : "").split("-").map(Number);

      for (let i = 1; i <= sessionsCount; i++) {
        let sessionDate: Date;
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
          dt.setUTCDate(dt.getUTCDate() + (i - 1) * 7);
          sessionDate = dt;
        } else {
          sessionDate = new Date(parsedStartDate.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
        }

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
    }

    const createdBatch = await prisma.courseBatch.findUnique({
      where: { id: batch.id },
      include: { sessions: { orderBy: { sessionNumber: "asc" } } },
    });

    return NextResponse.json({ success: true, batch: createdBatch }, { status: 201 });
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

    const parsedStartDate = startDate ? parseUtcDate(startDate) : undefined;

    await prisma.courseBatch.update({
      where: { id },
      data: {
        ...(batchName ? { batchName: batchName.trim() } : {}),
        ...(scheduleInfo !== undefined ? { scheduleInfo: scheduleInfo.trim() } : {}),
        ...(parsedStartDate ? { startDate: parsedStartDate } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    });

    // Handle individual session overrides / customization if provided
    if (Array.isArray(sessions)) {
      const existingSessions = await prisma.courseSession.findMany({
        where: { batchId: id },
      });
      const incomingIds = new Set(sessions.filter((s) => s.id).map((s) => s.id));

      // 1. Delete sessions removed by user in customization
      for (const ex of existingSessions) {
        if (!incomingIds.has(ex.id)) {
          await prisma.courseSession.delete({
            where: { id: ex.id },
          });
        }
      }

      // 2. Update existing or insert new sessions
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        const sDate = s.sessionDate ? parseUtcDate(s.sessionDate) : undefined;

        if (s.id && existingSessions.some((ex) => ex.id === s.id)) {
          await prisma.courseSession.update({
            where: { id: s.id },
            data: {
              sessionNumber: Number(s.sessionNumber) || i + 1,
              ...(sDate ? { sessionDate: sDate } : {}),
              ...(s.sessionTime !== undefined ? { sessionTime: s.sessionTime.trim() } : {}),
              ...(s.title !== undefined ? { title: s.title.trim() } : {}),
              ...(s.completed !== undefined ? { completed: Boolean(s.completed) } : {}),
            },
          });
        } else {
          // New session added by user
          await prisma.courseSession.create({
            data: {
              batchId: id,
              sessionNumber: Number(s.sessionNumber) || i + 1,
              title: s.title ? s.title.trim() : `Session ${i + 1}`,
              sessionDate: sDate || new Date(),
              sessionTime: s.sessionTime ? s.sessionTime.trim() : (scheduleInfo || "Evening"),
              completed: Boolean(s.completed),
            },
          });
        }
      }
    } else if (startDate && syncSessionDates) {
      // Automatically recalculate all session dates based on the new batch startDate (+7 days weekly)
      const existingSessions = await prisma.courseSession.findMany({
        where: { batchId: id },
        orderBy: { sessionNumber: "asc" },
      });

      const [y, m, d] = String(startDate).split("T")[0].split("-").map(Number);

      for (let idx = 0; idx < existingSessions.length; idx++) {
        const sess = existingSessions[idx];
        let newSessionDate: Date;
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
          dt.setUTCDate(dt.getUTCDate() + (sess.sessionNumber - 1) * 7);
          newSessionDate = dt;
        } else {
          newSessionDate = new Date(
            (parsedStartDate || new Date()).getTime() + (sess.sessionNumber - 1) * 7 * 24 * 60 * 60 * 1000
          );
        }

        await prisma.courseSession.update({
          where: { id: sess.id },
          data: {
            sessionDate: newSessionDate,
            ...(scheduleInfo ? { sessionTime: scheduleInfo.trim() } : {}),
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
