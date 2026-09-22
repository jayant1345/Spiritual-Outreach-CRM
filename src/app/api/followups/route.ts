import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const volunteerId = searchParams.get("volunteerId");

    const where: any = {};
    if (status !== "ALL") where.status = status;

    if (currentUser?.role === "CALLING_VOLUNTEER" || currentUser?.role === "RELATIONSHIP_VOLUNTEER") {
      where.volunteerId = currentUser.id;
    } else if (volunteerId && volunteerId !== "ALL") {
      where.volunteerId = volunteerId;
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

    const updated = await prisma.followupTask.update({
      where: { id },
      data: {
        status,
        remarks: remarks !== undefined ? remarks : undefined,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
