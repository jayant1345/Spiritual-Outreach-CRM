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

    if (action === "ASSIGN_VOLUNTEER" || action === "ASSIGN_CALLS") {
      if (!hasPermission(currentUser, "calling:assign")) {
        return NextResponse.json({ error: "Permission denied to assign calling persons." }, { status: 403 });
      }

      const volunteerId = value || body.volunteerId;
      const priority = body.priority || "NORMAL";
      const note = body.note || body.remarks || "";
      const sendNotification = body.sendNotification !== false;

      await prisma.person.updateMany({
        where: { id: { in: ids } },
        data: { assignedVolunteerId: volunteerId || null },
      });

      // If a volunteer was assigned and tasks/notifications are enabled:
      if (volunteerId && sendNotification) {
        const targetVol = await prisma.user.findUnique({
          where: { id: volunteerId },
          select: { id: true, name: true },
        });

        const now = new Date();
        const taskCreations = ids.map((pId: string) =>
          prisma.followupTask.create({
            data: {
              personId: pId,
              volunteerId: volunteerId,
              type: "Calling",
              status: "PENDING",
              priority: priority === "URGENT" ? "URGENT" : priority === "HIGH" ? "HIGH" : "MEDIUM",
              remarks: note ? `Calling assignment: ${note}` : `New call assigned by ${currentUser.name}`,
              dueDate: now,
            },
          })
        );

        const timelineCreations = ids.map((pId: string) =>
          prisma.timelineEvent.create({
            data: {
              personId: pId,
              eventType: "CALL",
              title: "Calls Assigned",
              description: `Assigned to ${targetVol?.name || "volunteer"} by ${currentUser.name}${note ? ` (${note})` : ""}`,
              createdByUserId: currentUser.id,
            },
          })
        );

        await prisma.$transaction([...taskCreations, ...timelineCreations]);
      }

      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "DISTRIBUTE_VOLUNTEERS") {
      if (!hasPermission(currentUser, "calling:assign")) {
        return NextResponse.json({ error: "Permission denied to assign calling persons." }, { status: 403 });
      }

      const volunteerIds = Array.isArray(value) ? value : body.volunteerIds;
      const batchTag = body.batchTag;
      const priority = body.priority || "NORMAL";
      const note = body.note || body.remarks || "";
      const sendNotification = body.sendNotification !== false;

      if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
        return NextResponse.json({ error: "No volunteers selected for distribution" }, { status: 400 });
      }

      // Round-robin equal distribution across selected volunteers
      const updates: any[] = [];
      const now = new Date();

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

        if (sendNotification) {
          updates.push(
            prisma.followupTask.create({
              data: {
                personId: ids[i],
                volunteerId: assignedVolId,
                type: "Calling",
                status: "PENDING",
                priority: priority === "URGENT" ? "URGENT" : priority === "HIGH" ? "HIGH" : "MEDIUM",
                remarks: note ? `Calling assignment: ${note}` : `New call assigned by ${currentUser.name}`,
                dueDate: now,
              },
            })
          );
        }
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
