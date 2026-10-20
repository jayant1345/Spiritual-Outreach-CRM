import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, getUserAssignedBatchIds } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    const userBatchIds = getUserAssignedBatchIds(currentUser);
    const isRestrictedVolunteer =
      currentUser &&
      !hasPermission(currentUser, "courses:manage") &&
      userBatchIds.length > 0;

    // Load batch volunteer assignments from privileges
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

    const batchVolunteersMap: Record<string, any[]> = {};
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
            if (!batchVolunteersMap[bId]) batchVolunteersMap[bId] = [];
            batchVolunteersMap[bId].push({
              id: u.id,
              name: u.name,
              phone: u.phone,
              role: u.role,
            });
          }
        }
      }
    }

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

    const enriched = courses
      .map((course) => {
        // Attach assigned volunteers to each batch
        let batches = course.batches.map((b) => ({
          ...b,
          assignedVolunteers: batchVolunteersMap[b.id] || [],
        }));

        // Filter batches for restricted volunteers (Devotees with specific batch sewa rights)
        if (isRestrictedVolunteer) {
          batches = batches.filter((b) => userBatchIds.includes(b.id));
        }

        let totalStudents = 0;
        let regularCount = 0;
        let irregularCount = 0;
        let lowCount = 0;

        batches.forEach((b) => {
          totalStudents += b.enrollments.length;
          regularCount += b.enrollments.filter((e) => e.status === "REGULAR").length;
          irregularCount += b.enrollments.filter((e) => e.status === "IRREGULAR").length;
          lowCount += b.enrollments.filter((e) => e.status === "LOW_ATTENDANCE").length;
        });

        return {
          ...course,
          batches,
          stats: {
            totalStudents: totalStudents || 0,
            regularCount: regularCount || 0,
            irregularCount: irregularCount || 0,
            lowCount: lowCount || 0,
          },
        };
      })
      .filter((course) => !isRestrictedVolunteer || course.batches.length > 0);

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

    // Parse start date safely at UTC noon
    let parsedStartDate = new Date();
    let dayName = "Saturday";
    if (startDate) {
      const [y, m, d] = String(startDate).split("T")[0].split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        parsedStartDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        dayName = weekdays[parsedStartDate.getUTCDay()];
      }
    }

    // Create default Batch 1 matching the actual weekday of the start date
    const batch = await prisma.courseBatch.create({
      data: {
        courseId: course.id,
        batchName: `Batch 1 (${dayName} Evening)`,
        startDate: parsedStartDate,
        scheduleInfo: `Every ${dayName} 6:30 PM`,
      },
    });

    // Generate initial sessions weekly
    const sessionsCount = Number(totalSessions) || 10;
    for (let i = 1; i <= sessionsCount; i++) {
      const dt = new Date(parsedStartDate.getTime());
      dt.setUTCDate(dt.getUTCDate() + (i - 1) * 7);

      await prisma.courseSession.create({
        data: {
          batchId: batch.id,
          sessionNumber: i,
          title: `Session ${i}: ${title} Part ${i}`,
          sessionDate: dt,
          sessionTime: "6:30 PM",
          completed: false,
        },
      });
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      title,
      courseType,
      facultyName,
      venue,
      totalSessions,
      startDate,
      description,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (courseType !== undefined) updateData.courseType = courseType.trim();
    if (facultyName !== undefined) updateData.facultyName = facultyName.trim();
    if (venue !== undefined) updateData.venue = venue.trim();
    if (totalSessions !== undefined) updateData.totalSessions = Number(totalSessions);
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (startDate) {
      const [y, m, d] = String(startDate).split("T")[0].split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        updateData.startDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      } else {
        updateData.startDate = new Date(startDate);
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        batches: {
          include: {
            sessions: { orderBy: { sessionNumber: "asc" } },
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error("Course PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // query param is sufficient
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Cascade delete: find batches for this course
    const batches = await prisma.courseBatch.findMany({
      where: { courseId: id },
      select: { id: true },
    });
    const batchIds = batches.map((b) => b.id);

    // Find sessions for these batches
    const sessions = await prisma.courseSession.findMany({
      where: { batchId: { in: batchIds } },
      select: { id: true },
    });
    const sessionIds = sessions.map((s) => s.id);

    // Delete in cascade order safely
    if (sessionIds.length > 0) {
      await prisma.sessionAttendance.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
    }

    if (batchIds.length > 0) {
      await prisma.courseSession.deleteMany({
        where: { batchId: { in: batchIds } },
      });
      await prisma.courseEnrollment.deleteMany({
        where: { batchId: { in: batchIds } },
      });
      await prisma.courseBatch.deleteMany({
        where: { id: { in: batchIds } },
      });
    }

    await prisma.courseEnrollment.deleteMany({
      where: { courseId: id },
    });

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Course DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
  }
}
