import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { evaluateCourseRegularity } from "@/lib/regularity";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, enrollmentId, personId, status, notes } = body;

    // 1. Upsert attendance record
    const attendance = await prisma.sessionAttendance.upsert({
      where: {
        sessionId_personId: {
          sessionId,
          personId,
        },
      },
      update: {
        status,
        notes,
        recordedAt: new Date(),
      },
      create: {
        sessionId,
        enrollmentId,
        personId,
        status,
        notes,
      },
      include: {
        session: true,
      },
    });

    // 2. Recalculate enrollment regularity
    const allAttendances = await prisma.sessionAttendance.findMany({
      where: { enrollmentId },
    });

    const attendedCount = allAttendances.filter((a) => a.status === "PRESENT").length;
    const totalRecorded = allAttendances.length;

    const evalResult = evaluateCourseRegularity(totalRecorded, attendedCount);

    await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        attendancePercent: evalResult.attendancePercent,
        status: evalResult.status,
      },
    });

    // 3. Log to 360 timeline
    await prisma.timelineEvent.create({
      data: {
        personId,
        eventType: "COURSE_SESSION",
        title: `Session ${attendance.session.sessionNumber} Attendance: [${status}]`,
        description: `Marked ${status}. Regularity standing: ${evalResult.statusLabel} (${evalResult.attendancePercent}%)`,
      },
    });

    // 4. Section 26: If student is ABSENT, automatically generate an Absentee Follow-up Task
    if (status === "ABSENT") {
      const person = await prisma.person.findUnique({
        where: { id: personId },
      });

      const volunteerId = person?.assignedVolunteerId || "default";

      await prisma.followupTask.create({
        data: {
          personId,
          volunteerId,
          type: "Calling",
          status: "PENDING",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
          priority: "URGENT",
          remarks: `Missed Session ${attendance.session.sessionNumber}. Follow-up with session recording & notes.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      attendance,
      regularity: evalResult,
    });
  } catch (error: any) {
    console.error("Error logging attendance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
