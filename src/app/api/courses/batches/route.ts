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
