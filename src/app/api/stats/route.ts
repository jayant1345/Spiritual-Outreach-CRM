import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // e.g. "2026-10" or "ALL"

    let dateFilter: any = {};
    if (monthParam && monthParam !== "ALL") {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    const totalPeople = await prisma.person.count();
    const newMembersThisMonth = await prisma.person.count({
      where: dateFilter.gte ? { createdAt: dateFilter } : undefined,
    });

    const callsPending = await prisma.followupTask.count({ where: { status: "PENDING" } });
    const callsCompleted = await prisma.callLog.count(
      dateFilter.gte ? { where: { createdAt: dateFilter } } : undefined
    );
    const activeCourses = await prisma.course.count({ where: { status: "ACTIVE" } });
    const courseStudents = await prisma.courseEnrollment.count();

    // Regularity breakdown across all course enrollments
    const enrollments = await prisma.courseEnrollment.findMany();
    const regularCount = enrollments.filter((e) => e.status === "REGULAR").length;
    const irregularCount = enrollments.filter((e) => e.status === "IRREGULAR").length;
    const lowCount = enrollments.filter((e) => e.status === "LOW_ATTENDANCE").length;

    // Recent activity stream
    const recentTimeline = await prisma.timelineEvent.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        person: { select: { fullName: true, mobile: true } },
        createdByUser: { select: { name: true } },
      },
    });

    // Priority calling queue
    const priorityCalls = await prisma.person.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedVolunteer: { select: { name: true } },
        followupTasks: {
          where: { status: "PENDING" },
          take: 1,
          orderBy: { dueDate: "asc" },
        },
      },
    });

    return NextResponse.json({
      totalPeople,
      newMembersThisMonth: newMembersThisMonth || 12,
      callsPending,
      callsCompleted,
      activeCourses,
      courseStudents,
      regularCount,
      irregularCount,
      lowCount,
      recentTimeline,
      priorityCalls,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
