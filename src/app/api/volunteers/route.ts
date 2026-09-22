import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const volunteers = await prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            assignedPeople: true,
            callLogs: true,
            followups: { where: { status: "PENDING" } },
          },
        },
      },
    });
    return NextResponse.json(volunteers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
