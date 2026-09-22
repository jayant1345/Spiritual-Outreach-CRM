import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        assignedVolunteer: true,
        relationshipVolunteer: true,
        timelineEvents: {
          orderBy: { createdAt: "desc" },
          include: { createdByUser: true },
        },
        callLogs: {
          orderBy: { createdAt: "desc" },
          include: { volunteer: true },
        },
        followupTasks: {
          orderBy: { dueDate: "asc" },
          include: { volunteer: true },
        },
        whatsappLogs: {
          orderBy: { createdAt: "desc" },
        },
        courseEnrollments: {
          include: {
            course: true,
            batch: true,
            attendances: {
              include: { session: true },
              orderBy: { session: { sessionNumber: "asc" } },
            },
          },
        },
        programParticipations: {
          include: { program: true },
          orderBy: { program: { eventDate: "desc" } },
        },
        japaLogs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json(person);
  } catch (error: any) {
    console.error("Error fetching person details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
