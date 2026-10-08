import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const where: any = {
      OR: [
        { fullName: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } },
        { area: { contains: q } },
      ],
    };

    const canViewAll = currentUser ? hasPermission(currentUser, "devotees:view_all") : false;
    if (!canViewAll && currentUser) {
      if (currentUser.role === "CALLING_VOLUNTEER") {
        where.assignedVolunteerId = currentUser.id;
      } else if (currentUser.role === "RELATIONSHIP_VOLUNTEER") {
        where.relationshipVolunteerId = currentUser.id;
      }
    }

    const members = await prisma.person.findMany({
      where,
      take: 8,
      select: {
        id: true,
        fullName: true,
        mobile: true,
        area: true,
        stage: true,
        profession: true,
        assignedVolunteer: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ results: members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
