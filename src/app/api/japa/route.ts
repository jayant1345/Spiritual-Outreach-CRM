import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.japaLog.findMany({
      take: 20,
      orderBy: { date: "desc" },
      include: {
        person: { select: { id: true, fullName: true, area: true } },
      },
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, rounds, remarks } = body;

    const log = await prisma.japaLog.create({
      data: {
        personId,
        rounds: Number(rounds),
        remarks,
      },
    });

    // Update person's daily rounds
    await prisma.person.update({
      where: { id: personId },
      data: { japaDailyRounds: Number(rounds) },
    });

    // Add to timeline
    await prisma.timelineEvent.create({
      data: {
        personId,
        eventType: "JAPA_UPDATE",
        title: `Japa Sadhana Logged: ${rounds} Rounds`,
        description: remarks || "Daily Hare Krishna Maha Mantra chanting recorded.",
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
