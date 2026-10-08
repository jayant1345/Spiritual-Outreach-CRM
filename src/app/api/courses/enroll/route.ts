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
    const { personId, personIds, batchId } = body;

    if ((!personId && (!Array.isArray(personIds) || personIds.length === 0)) || !batchId) {
      return NextResponse.json({ error: "Person ID(s) and Batch ID are required" }, { status: 400 });
    }

    const batch = await prisma.courseBatch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const targetPersonIds: string[] = personIds && Array.isArray(personIds) ? personIds : [personId];
    let enrolledCount = 0;
    let skippedCount = 0;
    const batchTag = batch.batchName.trim();

    for (const pid of targetPersonIds) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: { personId: pid, batchId },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.courseEnrollment.create({
        data: {
          personId: pid,
          courseId: batch.courseId,
          batchId,
          status: "ACTIVE",
          attendancePercent: 0,
        },
      });

      // Auto-tag person with batch name so they appear in batch searches & calling desk
      const personRecord = await prisma.person.findUnique({
        where: { id: pid },
        select: { id: true, tags: true },
      });

      if (personRecord) {
        const existingTags = personRecord.tags
          ? personRecord.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
        if (!existingTags.includes(batchTag)) {
          existingTags.push(batchTag);
          await prisma.person.update({
            where: { id: pid },
            data: { tags: existingTags.join(", ") },
          });
        }
      }

      await prisma.timelineEvent.create({
        data: {
          personId: pid,
          eventType: "COURSE_ENROLL",
          title: `Enrolled in ${batch.course.title} (${batch.batchName})`,
          description: `Enrollment registered by ${currentUser.name}. Tagged with '${batchTag}'.`,
          createdByUserId: currentUser.id,
        },
      });

      enrolledCount++;
    }

    return NextResponse.json({
      success: true,
      enrolled: enrolledCount,
      skipped: skippedCount,
      message: `Enrolled ${enrolledCount} member(s) into ${batch.batchName}.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Enrollment error:", error);
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
    const enrollmentId = searchParams.get("enrollmentId");
    const personId = searchParams.get("personId");
    const batchId = searchParams.get("batchId");

    if (enrollmentId) {
      await prisma.courseEnrollment.delete({
        where: { id: enrollmentId },
      });
      return NextResponse.json({ success: true, message: "Member removed from batch" });
    }

    if (personId && batchId) {
      await prisma.courseEnrollment.deleteMany({
        where: { personId, batchId },
      });
      return NextResponse.json({ success: true, message: "Member removed from batch" });
    }

    return NextResponse.json({ error: "Enrollment ID or Person ID & Batch ID required" }, { status: 400 });
  } catch (error: any) {
    console.error("Unenroll error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

