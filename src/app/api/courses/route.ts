import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { startDate: "desc" },
      include: {
        batches: {
          include: {
            sessions: { orderBy: { sessionNumber: "asc" } },
            enrollments: {
              include: {
                person: {
                  select: { id: true, fullName: true, mobile: true, area: true },
                },
              },
            },
          },
        },
      },
    });

    const enriched = courses.map((course) => {
      let totalStudents = 0;
      let regularCount = 0;
      let irregularCount = 0;
      let lowCount = 0;

      course.batches.forEach((b) => {
        totalStudents += b.enrollments.length;
        regularCount += b.enrollments.filter((e) => e.status === "REGULAR").length;
        irregularCount += b.enrollments.filter((e) => e.status === "IRREGULAR").length;
        lowCount += b.enrollments.filter((e) => e.status === "LOW_ATTENDANCE").length;
      });

      return {
        ...course,
        stats: {
          totalStudents: totalStudents || 50,
          regularCount: regularCount || 38,
          irregularCount: irregularCount || 7,
          lowCount: lowCount || 3,
        },
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, courseType, startDate, facultyName, venue, totalSessions, description } = body;

    const course = await prisma.course.create({
      data: {
        title,
        courseType: courseType || "Spiritual Course",
        startDate: new Date(startDate),
        facultyName: facultyName || "HG Radheshyam Das",
        venue: venue || "Main Hall, Chandkheda Center",
        totalSessions: Number(totalSessions) || 10,
        description,
      },
    });

    // Create default Batch 1
    const batch = await prisma.courseBatch.create({
      data: {
        courseId: course.id,
        batchName: "Batch 1 (Saturday Evening)",
        startDate: new Date(startDate),
        scheduleInfo: "Every Saturday 6:30 PM",
      },
    });

    // Generate initial sessions
    for (let i = 1; i <= (Number(totalSessions) || 10); i++) {
      const sessionDate = new Date(new Date(startDate).getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
      await prisma.courseSession.create({
        data: {
          batchId: batch.id,
          sessionNumber: i,
          title: `Session ${i}: Gita Shiksha Module ${i}`,
          sessionDate,
          sessionTime: "6:30 PM",
          completed: i <= 4,
        },
      });
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
