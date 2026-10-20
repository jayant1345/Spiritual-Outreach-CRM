import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, getUserAssignedBatchIds, isUserBatchRestricted } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const userId = searchParams.get("userId");

    // 1. If userId is specified: return user's assigned batches and all courses/batches for allocation
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          privileges: true,
        },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      let userPrivs: string[] = [];
      try {
        if (targetUser.privileges) userPrivs = JSON.parse(targetUser.privileges);
      } catch {
        userPrivs = [];
      }
      if (!Array.isArray(userPrivs)) userPrivs = [];

      const assignedBatchIds = userPrivs
        .filter((p) => typeof p === "string" && p.startsWith("batch:"))
        .map((p) => p.replace("batch:", "").trim());

      const courses = await prisma.course.findMany({
        orderBy: { startDate: "desc" },
        include: {
          batches: {
            orderBy: { startDate: "desc" },
            select: {
              id: true,
              batchName: true,
              scheduleInfo: true,
              active: true,
            },
          },
        },
      });

      const coursesWithAssignment = courses.map((course) => ({
        id: course.id,
        title: course.title,
        courseType: course.courseType,
        batches: course.batches.map((batch) => ({
          ...batch,
          isAssigned: assignedBatchIds.includes(batch.id),
        })),
      }));

      return NextResponse.json({
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          phone: targetUser.phone,
          role: targetUser.role,
        },
        assignedBatchIds,
        courses: coursesWithAssignment,
      });
    }

    // 2. If batchId is specified: return assigned users and all active volunteers for selection
    if (batchId) {
      const batch = await prisma.courseBatch.findUnique({
        where: { id: batchId },
        include: { course: { select: { title: true } } },
      });

      if (!batch) {
        return NextResponse.json({ error: "Batch not found" }, { status: 404 });
      }

      const allUsers = await prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          privileges: true,
        },
        orderBy: { name: "asc" },
      });

      const batchTag = `batch:${batchId}`;
      const assignedUserIds: string[] = [];
      const assignedUsers: any[] = [];
      const allVolunteers: any[] = [];

      for (const u of allUsers) {
        let userPrivs: string[] = [];
        try {
          if (u.privileges) userPrivs = JSON.parse(u.privileges);
        } catch {
          userPrivs = [];
        }

        const isAssigned = Array.isArray(userPrivs) && userPrivs.includes(batchTag);
        if (isAssigned) {
          assignedUserIds.push(u.id);
          assignedUsers.push({
            id: u.id,
            name: u.name,
            phone: u.phone,
            role: u.role,
            email: u.email,
          });
        }

        allVolunteers.push({
          id: u.id,
          name: u.name,
          phone: u.phone,
          role: u.role,
          email: u.email,
          isAssigned,
        });
      }

      return NextResponse.json({
        batchId,
        batchName: batch.batchName,
        courseTitle: batch.course.title,
        assignedUserIds,
        assignedUsers,
        allVolunteers,
      });
    }

    // 3. If no batchId and no userId: return a mapping of all batchIds to their assigned volunteers
    const usersWithBatches = await prisma.user.findMany({
      where: {
        active: true,
        privileges: { contains: "batch:" },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        privileges: true,
      },
    });

    const batchMap: Record<string, any[]> = {};
    const userBatchMap: Record<string, string[]> = {};

    for (const u of usersWithBatches) {
      let privs: string[] = [];
      try {
        if (u.privileges) privs = JSON.parse(u.privileges);
      } catch {
        privs = [];
      }

      if (Array.isArray(privs)) {
        userBatchMap[u.id] = [];
        for (const p of privs) {
          if (typeof p === "string" && p.startsWith("batch:")) {
            const bId = p.replace("batch:", "").trim();
            userBatchMap[u.id].push(bId);

            if (!batchMap[bId]) batchMap[bId] = [];
            batchMap[bId].push({
              id: u.id,
              name: u.name,
              phone: u.phone,
              role: u.role,
            });
          }
        }
      }
    }

    return NextResponse.json({ batchMap, userBatchMap });
  } catch (error: any) {
    console.error("Error fetching batch volunteers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const canManage =
      currentUser &&
      (currentUser.role === "SUPER_ADMIN" ||
        currentUser.role === "ADMIN" ||
        currentUser.role === "TEAM_LEADER" ||
        hasPermission(currentUser, "courses:manage"));

    if (!canManage) {
      return NextResponse.json(
        { error: "Unauthorized. Admin or Authorized Team Leader rights required to allocate batch sewa." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { batchId, volunteerIds, userId, batchIds } = body;

    // Mode A: Assign multiple batches across courses to a specific user (User -> Batches)
    if (userId) {
      if (!Array.isArray(batchIds)) {
        return NextResponse.json({ error: "batchIds must be an array of batch IDs" }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, privileges: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      let currentPrivs: string[] = [];
      try {
        if (targetUser.privileges) currentPrivs = JSON.parse(targetUser.privileges);
      } catch {
        currentPrivs = [];
      }
      if (!Array.isArray(currentPrivs)) currentPrivs = [];

      // Remove any existing batch tags
      const nonBatchPrivs = currentPrivs.filter((p) => typeof p !== "string" || !p.startsWith("batch:"));
      // Add new batch tags
      const newBatchTags = batchIds.map((bId) => `batch:${bId}`);
      const updatedPrivs = [...nonBatchPrivs, ...newBatchTags];

      await prisma.user.update({
        where: { id: userId },
        data: {
          privileges: updatedPrivs.length > 0 ? JSON.stringify(updatedPrivs) : null,
        },
      });

      return NextResponse.json({
        success: true,
        userId,
        userName: targetUser.name,
        assignedBatchIds: batchIds,
      });
    }

    // Mode B: Assign multiple volunteers to a specific batch (Batch -> Volunteers)
    if (!batchId) {
      return NextResponse.json({ error: "batchId or userId is required" }, { status: 400 });
    }

    if (!Array.isArray(volunteerIds)) {
      return NextResponse.json({ error: "volunteerIds must be an array of user IDs" }, { status: 400 });
    }

    const batch = await prisma.courseBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const targetVolunteerIdSet = new Set(volunteerIds);
    const batchTag = `batch:${batchId}`;

    // Fetch all active users to update permissions
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        privileges: true,
      },
    });

    let updatedCount = 0;

    for (const u of allUsers) {
      let privs: string[] = [];
      try {
        if (u.privileges) privs = JSON.parse(u.privileges);
      } catch {
        privs = [];
      }
      if (!Array.isArray(privs)) privs = [];

      const currentlyHas = privs.includes(batchTag);
      const shouldHave = targetVolunteerIdSet.has(u.id);

      if (shouldHave && !currentlyHas) {
        // Add batch permission
        const newPrivs = [...privs, batchTag];
        await prisma.user.update({
          where: { id: u.id },
          data: { privileges: JSON.stringify(newPrivs) },
        });
        updatedCount++;
      } else if (!shouldHave && currentlyHas) {
        // Remove batch permission
        const newPrivs = privs.filter((p) => p !== batchTag);
        await prisma.user.update({
          where: { id: u.id },
          data: { privileges: newPrivs.length > 0 ? JSON.stringify(newPrivs) : null },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      assignedUserIds: volunteerIds,
      assignedCount: volunteerIds.length,
      usersUpdated: updatedCount,
    });
  } catch (error: any) {
    console.error("Error saving batch volunteers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
