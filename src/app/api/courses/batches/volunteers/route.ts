import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    // 1. If batchId is specified: return assigned users and all active volunteers for selection
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

    // 2. If no batchId: return a mapping of all batchIds to their assigned volunteers
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

    for (const u of usersWithBatches) {
      let privs: string[] = [];
      try {
        if (u.privileges) privs = JSON.parse(u.privileges);
      } catch {
        privs = [];
      }

      if (Array.isArray(privs)) {
        for (const p of privs) {
          if (typeof p === "string" && p.startsWith("batch:")) {
            const bId = p.replace("batch:", "").trim();
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

    return NextResponse.json({ batchMap });
  } catch (error: any) {
    console.error("Error fetching batch volunteers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json(
        { error: "Unauthorized. Courses management permission required to assign batch rights." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { batchId, volunteerIds } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
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
