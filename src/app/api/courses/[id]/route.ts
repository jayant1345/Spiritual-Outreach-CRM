import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        batches: {
          include: {
            sessions: { orderBy: { sessionNumber: "asc" } },
            enrollments: {
              include: {
                person: {
                  include: {
                    assignedVolunteer: true,
                    callLogs: {
                      orderBy: { createdAt: "desc" },
                      take: 5,
                    },
                  },
                },
                attendances: {
                  include: { session: true },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
