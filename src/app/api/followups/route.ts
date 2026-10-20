import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getUserAssignedBatchIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const volunteerId = searchParams.get("volunteerId");
    const scope = searchParams.get("scope"); // "all" | "me"

    const where: any = {};
    if (status !== "ALL") where.status = status;

    // User isolation with batch coordination support:
    const canViewAll = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "COORDINATOR";
    const userBatchIds = getUserAssignedBatchIds(currentUser);
    const hasBatchRestrictions = !canViewAll && userBatchIds.length > 0;

    if (volunteerId && volunteerId !== "ALL") {
      where.volunteerId = volunteerId;
    } else if (canViewAll && (scope === "all" || volunteerId === "ALL")) {
      // allow viewing all team tasks across entire center
    } else if (hasBatchRestrictions && (scope === "all" || volunteerId === "ALL")) {
      // allow viewing follow-up tasks of devotees in their assigned batch(es) so assigned sevaks can coordinate
      where.person = {
        courseEnrollments: {
          some: {
            batchId: { in: userBatchIds },
          },
        },
      };
    } else if (currentUser) {
      where.volunteerId = currentUser.id;
    }

    const followups = await prisma.followupTask.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            area: true,
            stage: true,
          },
        },
        volunteer: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(followups);
  } catch (error: any) {
    console.error("Error fetching follow-ups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await prisma.followupTask.update({
      where: { id },
      data: {
        status: status || "COMPLETED",
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        remarks: remarks !== undefined ? remarks : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating follow-up:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
