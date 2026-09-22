import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, templateId, messageBody } = body;

    // 1. Log to WhatsApp Log
    const log = await prisma.whatsAppLog.create({
      data: {
        personId,
        templateId: templateId || null,
        messageBody,
        status: "SENT",
      },
    });

    // 2. Add to 360 Timeline
    await prisma.timelineEvent.create({
      data: {
        personId,
        eventType: "WHATSAPP",
        title: "WhatsApp Message Sent via Click-to-Chat",
        description: messageBody.slice(0, 140) + (messageBody.length > 140 ? "..." : ""),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error("Error logging whatsapp send:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
