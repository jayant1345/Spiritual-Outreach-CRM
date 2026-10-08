import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

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

// PATCH update devotee
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "devotees:edit")) {
      return NextResponse.json({ error: "Unauthorized. Edit permission required." }, { status: 403 });
    }

    const body = await request.json();
    const {
      fullName,
      mobile,
      whatsappNumber,
      email,
      area,
      ageGroup,
      profession,
      source,
      stage,
      assignedVolunteerId,
      relationshipVolunteerId,
      tags,
      notes,
      address,
      japaDailyRounds,
      spiritualMentor,
    } = body;

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (email !== undefined) updateData.email = email;
    if (area !== undefined) updateData.area = area;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
    if (profession !== undefined) updateData.profession = profession;
    if (source !== undefined) updateData.source = source;
    if (stage !== undefined) updateData.stage = stage;
    if (assignedVolunteerId !== undefined) updateData.assignedVolunteerId = assignedVolunteerId || null;
    if (relationshipVolunteerId !== undefined) updateData.relationshipVolunteerId = relationshipVolunteerId || null;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.join(", ") : tags;
    if (notes !== undefined) updateData.notes = notes;
    if (address !== undefined) updateData.address = address;
    if (japaDailyRounds !== undefined) updateData.japaDailyRounds = parseInt(japaDailyRounds) || 0;
    if (spiritualMentor !== undefined) updateData.spiritualMentor = spiritualMentor;

    const updated = await prisma.person.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.timelineEvent.create({
      data: {
        personId: params.id,
        eventType: "NOTE",
        title: "Devotee Profile Updated",
        description: `Profile edited by ${currentUser.name} (${currentUser.role}).`,
        createdByUserId: currentUser.id,
      },
    });

    return NextResponse.json({ success: true, person: updated });
  } catch (error: any) {
    console.error("Error updating person:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE devotee
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "devotees:delete")) {
      return NextResponse.json({ error: "Unauthorized. Delete permission required." }, { status: 403 });
    }

    const person = await prisma.person.findUnique({
      where: { id: params.id },
      select: { fullName: true },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Clean up dependent child records not handled by cascade
    await prisma.courseEnrollment.deleteMany({ where: { personId: params.id } });
    await prisma.programParticipation.deleteMany({ where: { personId: params.id } });
    await prisma.japaLog.deleteMany({ where: { personId: params.id } });
    await prisma.yatraParticipation.deleteMany({ where: { personId: params.id } });
    await prisma.sessionAttendance.deleteMany({ where: { personId: params.id } });

    await prisma.person.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `Devotee ${person.fullName} successfully removed from the CRM.`,
    });
  } catch (error: any) {
    console.error("Error deleting person:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
