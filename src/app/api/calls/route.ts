import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const volunteerId = searchParams.get("volunteerId");
    const personId = searchParams.get("personId");
    const outcome = searchParams.get("outcome");
    const limit = searchParams.get("limit");

    const where: any = {};
    if (volunteerId && volunteerId !== "ALL") {
      where.volunteerId = volunteerId;
    }
    if (personId) {
      where.personId = personId;
    }
    if (outcome && outcome !== "ALL") {
      where.outcome = outcome;
    }

    const calls = await prisma.callLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : 100,
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            whatsappNumber: true,
            area: true,
            stage: true,
            assignedVolunteerId: true,
            relationshipVolunteerId: true,
          },
        },
        volunteer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(calls);
  } catch (error: any) {
    console.error("Error fetching call logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const body = await request.json();
    const {
      personId,
      callType,
      outcome,
      notes,
      scheduleFollowup,
      followUpDate,
      followUpPriority,
    } = body;

    let volunteerId = currentUser?.id;
    if (!volunteerId) {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: { in: ["CALLING_VOLUNTEER", "COORDINATOR", "SUPER_ADMIN"] } },
      });
      volunteerId = fallbackUser?.id || "admin";
    }

    const callLog = await prisma.callLog.create({
      data: {
        personId,
        volunteerId,
        callType: callType || "Calling Sewa",
        outcome,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpPriority: followUpPriority || "MEDIUM",
      },
    });

    await prisma.timelineEvent.create({
      data: {
        personId,
        eventType: "CALL",
        title: `${callType}: [${outcome.replace(/_/g, " ")}]`,
        description: notes || `Call completed by ${currentUser?.name || "volunteer"}.`,
        createdByUserId: volunteerId,
      },
    });

    if (outcome === "YES_WILL_ATTEND") {
      await prisma.person.update({
        where: { id: personId },
        data: { stage: "Confirmed" },
      });
    } else if (outcome === "CONNECTED" || outcome === "INTERESTED") {
      await prisma.person.update({
        where: { id: personId },
        data: { stage: "Interested" },
      });
    }

    if (scheduleFollowup && followUpDate) {
      await prisma.followupTask.create({
        data: {
          personId,
          volunteerId,
          type: "Calling",
          status: "PENDING",
          dueDate: new Date(followUpDate),
          priority: followUpPriority || "MEDIUM",
          remarks: notes || `Follow-up after ${outcome}`,
        },
      });
    }

    return NextResponse.json(callLog, { status: 201 });
  } catch (error: any) {
    console.error("Error logging call:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
