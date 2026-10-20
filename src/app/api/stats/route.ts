import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getUserAssignedBatchIds } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // e.g. "2026-10" or "ALL"
    const scope = searchParams.get("scope"); // "me" (default) or "all"
    const courseId = searchParams.get("courseId"); // "ALL" or course cuid
    const batchIdsParam = searchParams.get("batchIds"); // comma-separated batch cuids

    let dateFilter: any = {};
    if (monthParam && monthParam !== "ALL") {
      const [yearStr, monthStr] = monthParam.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const canViewAll =
      currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.role === "ADMIN" ||
      currentUser?.role === "TEAM_LEADER" ||
      currentUser?.role === "COORDINATOR";

    const isPersonalScope = !canViewAll || scope === "me";

    const userBatchIds = getUserAssignedBatchIds(currentUser);
    const hasBatchRestrictions = !canViewAll && userBatchIds.length > 0;

    // 1. Workspace Filtering (Course & Batches)
    const rawParsedBatchIds = batchIdsParam
      ? batchIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const parsedBatchIds = hasBatchRestrictions
      ? (rawParsedBatchIds.length > 0 ? rawParsedBatchIds.filter((id) => userBatchIds.includes(id)) : userBatchIds)
      : rawParsedBatchIds;

    const isCourseFiltered = courseId && courseId !== "ALL";
    let targetPersonIds: string[] | null = null;
    let targetBatchIds: string[] = [];

    if (isCourseFiltered) {
      const enrollmentWhere: any = { courseId };
      if (parsedBatchIds.length > 0) {
        enrollmentWhere.batchId = { in: parsedBatchIds };
        targetBatchIds = parsedBatchIds;
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where: enrollmentWhere,
        select: { personId: true, batchId: true },
      });

      targetPersonIds = Array.from(new Set(enrollments.map((e) => e.personId)));

      if (parsedBatchIds.length === 0) {
        targetBatchIds = Array.from(new Set(enrollments.map((e) => e.batchId).filter(Boolean) as string[]));
      }
    } else if (parsedBatchIds.length > 0) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { batchId: { in: parsedBatchIds } },
        select: { personId: true, batchId: true },
      });
      targetPersonIds = Array.from(new Set(enrollments.map((e) => e.personId)));
      targetBatchIds = parsedBatchIds;
    }

    // 2. Metrics Calculation according to Step 4 of PRD:
    // • Total Contacts
    // • Total Assigned Contacts
    // • Total Pending Calls
    // • Today's Follow-ups
    // • Interested Devotees
    // • Registered Devotees

    const personFilter: any = {};
    if (targetPersonIds !== null) {
      personFilter.id = { in: targetPersonIds };
    }
    if (isPersonalScope && currentUser) {
      personFilter.assignedVolunteerId = currentUser.id;
    }

    const totalContacts = await prisma.person.count({ where: personFilter });

    const totalAssignedContacts = await prisma.person.count({
      where: {
        ...personFilter,
        assignedVolunteerId: { not: null },
      },
    });

    const registeredDevotees = targetPersonIds !== null ? targetPersonIds.length : await prisma.courseEnrollment.count();

    const interestedDevotees = await prisma.person.count({
      where: {
        ...personFilter,
        stage: { in: ["Interested", "Confirmed", "Relationship Follow-up", "Connected"] },
      },
    });

    // Pending Follow-up calls
    const pendingWhere: any = { status: "PENDING" };
    if (targetPersonIds !== null) {
      pendingWhere.personId = { in: targetPersonIds };
    }
    if (isPersonalScope && currentUser) {
      pendingWhere.volunteerId = currentUser.id;
    }
    const callsPending = await prisma.followupTask.count({ where: pendingWhere });

    // Today's follow-ups
    const todayFollowups = await prisma.followupTask.count({
      where: {
        ...pendingWhere,
        dueDate: { lte: todayEnd },
      },
    });

    // Completed Calls
    const callLogWhere: any = {};
    if (targetPersonIds !== null) {
      callLogWhere.personId = { in: targetPersonIds };
    }
    if (dateFilter.gte) {
      callLogWhere.createdAt = dateFilter;
    }
    if (isPersonalScope && currentUser) {
      callLogWhere.volunteerId = currentUser.id;
    }
    const callsCompleted = await prisma.callLog.count({ where: callLogWhere });

    // 3. Batch-Wise Performance
    let batchPerformance: any[] = [];
    if (isCourseFiltered || targetBatchIds.length > 0) {
      const batchesWhere: any = {};
      if (isCourseFiltered) batchesWhere.courseId = courseId;
      if (targetBatchIds.length > 0) batchesWhere.id = { in: targetBatchIds };

      const batches = await prisma.courseBatch.findMany({
        where: batchesWhere,
        include: {
          enrollments: {
            select: { id: true, personId: true, status: true },
          },
        },
      });

      for (const b of batches) {
        const bPersonIds = b.enrollments.map((e) => e.personId);
        const bPendingCalls = bPersonIds.length > 0
          ? await prisma.followupTask.count({ where: { personId: { in: bPersonIds }, status: "PENDING" } })
          : 0;
        const bCompletedCalls = bPersonIds.length > 0
          ? await prisma.callLog.count({ where: { personId: { in: bPersonIds } } })
          : 0;

        const regularCount = b.enrollments.filter((e) => e.status === "REGULAR").length;
        const attendanceRate = b.enrollments.length > 0 ? Math.round((regularCount / b.enrollments.length) * 100) : 0;

        batchPerformance.push({
          id: b.id,
          batchName: b.batchName,
          scheduleInfo: b.scheduleInfo,
          enrolledCount: b.enrollments.length,
          pendingCalls: bPendingCalls,
          completedCalls: bCompletedCalls,
          attendanceRate,
          regularCount,
        });
      }
    }

    // 4. Volunteer-Wise Performance
    let volunteerPerformance: any[] = [];
    const volunteers = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
    });

    for (const v of volunteers) {
      const vPersonWhere: any = { assignedVolunteerId: v.id };
      if (targetPersonIds !== null) {
        vPersonWhere.id = { in: targetPersonIds };
      }

      const assignedCount = await prisma.person.count({ where: vPersonWhere });
      if (assignedCount === 0 && targetPersonIds !== null) continue;

      const vPendingWhere: any = { volunteerId: v.id, status: "PENDING" };
      if (targetPersonIds !== null) {
        vPendingWhere.personId = { in: targetPersonIds };
      }
      const vPendingCalls = await prisma.followupTask.count({ where: vPendingWhere });

      const vCallLogWhere: any = { volunteerId: v.id };
      if (targetPersonIds !== null) {
        vCallLogWhere.personId = { in: targetPersonIds };
      }
      const vCompletedCalls = await prisma.callLog.count({ where: vCallLogWhere });

      const positiveResponses = await prisma.callLog.count({
        where: {
          ...vCallLogWhere,
          outcome: { in: ["YES_WILL_ATTEND", "INTERESTED", "CONFIRMED"] },
        },
      });

      volunteerPerformance.push({
        id: v.id,
        name: v.name,
        role: v.role,
        assignedCount,
        completedCalls: vCompletedCalls,
        pendingCalls: vPendingCalls,
        positiveResponses,
      });
    }

    // 5. Recent timeline events (Attribution: who performed which seva)
    const recentTimeline = await prisma.timelineEvent.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        person: { select: { fullName: true, mobile: true } },
        createdByUser: { select: { name: true } },
      },
    });

    return NextResponse.json({
      // PRD Step 4 Metrics:
      totalContacts,
      totalAssignedContacts,
      totalPendingCalls: callsPending,
      todayFollowups,
      interestedDevotees,
      registeredDevotees,
      batchPerformance,
      volunteerPerformance,

      // Legacy / General metrics:
      totalPeople: totalContacts,
      newMembersThisMonth: 12,
      callsPending,
      callsCompleted,
      recentTimeline,
      activeCourses: await prisma.course.count({ where: { status: "ACTIVE" } }),
      courseStudents: registeredDevotees,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
