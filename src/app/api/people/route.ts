import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const area = searchParams.get("area") || "";
    const stage = searchParams.get("stage") || "";
    const source = searchParams.get("source") || "";
    const volunteerId = searchParams.get("volunteerId") || "";
    const tag = searchParams.get("tag") || searchParams.get("batch") || "";

    const where: any = {};

    // RBAC: Check whether user can view all devotees or only their assigned contacts
    const canViewAll = currentUser ? hasPermission(currentUser, "devotees:view_all") : false;

    if (!canViewAll && currentUser) {
      if (currentUser.role === "CALLING_VOLUNTEER") {
        where.assignedVolunteerId = currentUser.id;
      } else if (currentUser.role === "RELATIONSHIP_VOLUNTEER") {
        where.relationshipVolunteerId = currentUser.id;
      }
    } else if (volunteerId && volunteerId !== "ALL") {
      where.assignedVolunteerId = volunteerId;
    }

    if (query) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { fullName: { contains: query } },
          { mobile: { contains: query } },
          { email: { contains: query } },
          { area: { contains: query } },
          { tags: { contains: query } },
        ],
      });
    }

    if (area && area !== "ALL") where.area = { contains: area };
    if (stage && stage !== "ALL") where.stage = stage;
    if (source && source !== "ALL" && !searchParams.get("batch")) where.source = source;

    const batchFilter = searchParams.get("batch") || tag;
    if (batchFilter && batchFilter !== "ALL") {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { tags: { contains: batchFilter } },
          { source: { contains: batchFilter } },
          {
            courseEnrollments: {
              some: {
                batch: {
                  batchName: { contains: batchFilter },
                },
              },
            },
          },
        ],
      });
    }

    const people = await prisma.person.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedVolunteer: { select: { id: true, name: true, role: true } },
        relationshipVolunteer: { select: { id: true, name: true } },
        courseEnrollments: {
          select: {
            id: true,
            status: true,
            attendancePercent: true,
            course: { select: { title: true } },
            batch: { select: { id: true, batchName: true } },
          },
        },
        programParticipations: {
          select: {
            id: true,
            invitationStatus: true,
            attendanceStatus: true,
            program: { select: { title: true } },
          },
        },
      },
    });

    return NextResponse.json(people);
  } catch (error: any) {
    console.error("Error fetching people:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "devotees:create")) {
      return NextResponse.json({ error: "Unauthorized. Permission to add devotees is required." }, { status: 403 });
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
      customData,
    } = body;

    if (!fullName || !mobile) {
      return NextResponse.json(
        { error: "Full Name and Mobile Number are required" },
        { status: 400 }
      );
    }

    const defaultVolunteerId = assignedVolunteerId || (currentUser?.role === "CALLING_VOLUNTEER" ? currentUser.id : null);

    const person = await prisma.person.create({
      data: {
        fullName,
        mobile,
        whatsappNumber: whatsappNumber || mobile,
        email,
        area,
        ageGroup,
        profession,
        source: source || "Reference",
        stage: stage || "New Person",
        assignedVolunteerId: defaultVolunteerId,
        relationshipVolunteerId,
        tags: Array.isArray(tags) ? tags.join(", ") : tags,
        notes,
        address,
        japaDailyRounds: japaDailyRounds ? parseInt(japaDailyRounds) : 0,
        spiritualMentor,
        customData: customData ? JSON.stringify(customData) : null,
      },
    });

    await prisma.timelineEvent.create({
      data: {
        personId: person.id,
        eventType: "NOTE",
        title: "Devotee Profile Registered",
        description: `Profile added to CRM by ${currentUser?.name || "Volunteer"}. Initial Stage: ${person.stage}.`,
        createdByUserId: currentUser?.id,
      },
    });

    return NextResponse.json(person, { status: 201 });
  } catch (error: any) {
    console.error("Error creating person:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
