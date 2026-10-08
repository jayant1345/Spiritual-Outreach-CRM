import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, action, value } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No members selected" }, { status: 400 });
    }

    if (action === "ASSIGN_VOLUNTEER") {
      if (!hasPermission(currentUser, "calling:assign")) {
        return NextResponse.json({ error: "Permission denied to assign calling persons." }, { status: 403 });
      }

      await prisma.person.updateMany({
        where: { id: { in: ids } },
        data: { assignedVolunteerId: value || null },
      });

      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "DISTRIBUTE_VOLUNTEERS") {
      if (!hasPermission(currentUser, "calling:assign")) {
        return NextResponse.json({ error: "Permission denied to assign calling persons." }, { status: 403 });
      }

      const volunteerIds = Array.isArray(value) ? value : body.volunteerIds;
      const batchTag = body.batchTag;

      if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
        return NextResponse.json({ error: "No volunteers selected for distribution" }, { status: 400 });
      }

      // Round-robin equal distribution across selected volunteers
      const updates = [];
      for (let i = 0; i < ids.length; i++) {
        const assignedVolId = volunteerIds[i % volunteerIds.length];
        const updateData: any = { assignedVolunteerId: assignedVolId };
        if (batchTag) {
          updateData.tags = batchTag;
        }
        updates.push(
          prisma.person.update({
            where: { id: ids[i] },
            data: updateData,
          })
        );
      }

      await prisma.$transaction(updates);

      return NextResponse.json({
        success: true,
        count: ids.length,
        volunteersCount: volunteerIds.length,
      });
    }

    if (action === "TAG_BATCH") {
      if (!hasPermission(currentUser, "devotees:edit")) {
        return NextResponse.json({ error: "Permission denied to edit tags." }, { status: 403 });
      }

      await prisma.person.updateMany({
        where: { id: { in: ids } },
        data: { tags: value },
      });

      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "CHANGE_STATUS") {
      if (!hasPermission(currentUser, "devotees:edit")) {
        return NextResponse.json({ error: "Permission denied to edit status." }, { status: 403 });
      }

      await prisma.person.updateMany({
        where: { id: { in: ids } },
        data: { stage: value },
      });

      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "ADD_TO_BATCH") {
      if (!hasPermission(currentUser, "courses:manage")) {
        return NextResponse.json({ error: "Permission denied to manage batches." }, { status: 403 });
      }

      const batch = await prisma.courseBatch.findUnique({
        where: { id: value },
        select: { courseId: true },
      });

      if (!batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
      }

      let enrolledCount = 0;
      for (const id of ids) {
        const existing = await prisma.courseEnrollment.findFirst({
          where: { personId: id, batchId: value },
        });

        if (!existing) {
          await prisma.courseEnrollment.create({
            data: {
              personId: id,
              courseId: batch.courseId,
              batchId: value,
              status: "ACTIVE",
            },
          });
          enrolledCount++;
        }
      }

      return NextResponse.json({ success: true, enrolledCount });
    }

    return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
