import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = { status: "PENDING" };
    if (currentUser.role === "CALLING_VOLUNTEER" || currentUser.role === "RELATIONSHIP_VOLUNTEER") {
      where.volunteerId = currentUser.id;
    }

    const tasks = await prisma.followupTask.findMany({
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
        volunteer: { select: { id: true, name: true } },
      },
      take: 50,
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const overdue: any[] = [];
    const today: any[] = [];
    const upcoming: any[] = [];

    tasks.forEach((t) => {
      const due = new Date(t.dueDate);
      if (due < startOfToday) {
        overdue.push(t);
      } else if (due <= endOfToday) {
        today.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return NextResponse.json({
      totalPending: tasks.length,
      overdue,
      today,
      upcoming,
    });
  } catch (error: any) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const updated = await prisma.followupTask.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
