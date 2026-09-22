import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { note } = body;

    const event = await prisma.timelineEvent.create({
      data: {
        personId: params.id,
        eventType: "NOTE",
        title: "Devotee Note Added",
        description: note,
      },
    });

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
