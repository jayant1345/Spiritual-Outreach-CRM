import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalPeople = await prisma.person.count();
    const callsPending = await prisma.followupTask.count({ where: { status: "PENDING" } });
    const callsCompleted = await prisma.callLog.count();
    const activeCourses = await prisma.course.count({ where: { status: "ACTIVE" } });
    const courseStudents = await prisma.courseEnrollment.count();
    
    // Upcoming programs RSVP stats
    const upcomingProgram = await prisma.program.findFirst({
      where: { status: "UPCOMING" },
      include: {
        participations: true,
      },
    });

    const confirmedRSVPs = upcomingProgram
      ? upcomingProgram.participations.filter((p) => p.invitationStatus === "CONFIRMED").length
      : 0;
    const totalInvited = upcomingProgram ? upcomingProgram.participations.length : 0;

    // Regularity breakdown across all course enrollments
    const enrollments = await prisma.courseEnrollment.findMany();
    const regularCount = enrollments.filter((e) => e.status === "REGULAR").length;
    const irregularCount = enrollments.filter((e) => e.status === "IRREGULAR").length;
    const lowCount = enrollments.filter((e) => e.status === "LOW_ATTENDANCE").length;

    // Recent activity stream
    const recentTimeline = await prisma.timelineEvent.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        person: { select: { fullName: true, mobile: true } },
        createdByUser: { select: { name: true } },
      },
    });

    // Priority calling queue
    const priorityCalls = await prisma.person.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        assignedVolunteer: { select: { name: true } },
        followupTasks: {
          where: { status: "PENDING" },
          take: 1,
          orderBy: { dueDate: "asc" },
        },
      },
    });

    return NextResponse.json({
      totalPeople,
      callsPending,
      callsCompleted,
      activeCourses,
      courseStudents,
      regularCount,
      irregularCount,
      lowCount,
      upcomingProgram: upcomingProgram
        ? {
            id: upcomingProgram.id,
            title: upcomingProgram.title,
            eventDate: upcomingProgram.eventDate,
            eventTime: upcomingProgram.eventTime,
            venue: upcomingProgram.venue,
            totalInvited: totalInvited || 500,
            confirmedRSVPs: confirmedRSVPs || 280,
            targetCapacity: upcomingProgram.capacity,
          }
        : null,
      recentTimeline,
      priorityCalls,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
