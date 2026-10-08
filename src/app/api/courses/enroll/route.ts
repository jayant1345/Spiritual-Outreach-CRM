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

    const { personId, batchId } = await request.json();

    if (!personId || !batchId) {
      return NextResponse.json({ error: "Person ID and Batch ID are required" }, { status: 400 });
    }

    const batch = await prisma.courseBatch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const existing = await prisma.courseEnrollment.findFirst({
      where: { personId, batchId },
    });

    if (existing) {
      return NextResponse.json({ error: "This member is already enrolled in this batch." }, { status: 400 });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        personId,
        courseId: batch.courseId,
        batchId,
        status: "ACTIVE",
        attendancePercent: 0,
      },
      include: { person: true },
    });

    await prisma.timelineEvent.create({
      data: {
        personId,
        eventType: "COURSE_ENROLL",
        title: `Enrolled in ${batch.course.title} (${batch.batchName})`,
        description: `Enrollment registered by ${currentUser.name}.`,
        createdByUserId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
