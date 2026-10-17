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

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "me"; // "me" (default) or "all"

    const where: any = { status: "PENDING" };

    // Default to logged-in user's tasks. Only show all team tasks if explicitly requested by admin/coordinator
    const canViewAll = currentUser.role === "SUPER_ADMIN" || currentUser.role === "COORDINATOR";
    if (!canViewAll || scope !== "all") {
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
      take: 100,
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
      dueCount: overdue.length + today.length, // Actionable count (due today or overdue)
      totalPending: tasks.length,
      all: tasks,
      overdue,
      today,
      upcoming,
      scope,
      canViewAll,
    });
  } catch (error: any) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Support bulk mark as done
    if (body.action === "complete_all") {
      const scope = body.scope || "me";
      const canViewAll = currentUser.role === "SUPER_ADMIN" || currentUser.role === "COORDINATOR";
      const where: any = { status: "PENDING" };

      if (!canViewAll || scope !== "all") {
        where.volunteerId = currentUser.id;
      }

      await prisma.followupTask.updateMany({
        where,
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "All tasks marked as completed" });
    }

    const { id } = body;
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
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
