import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, bodyText, variablesList } = body;

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        category: category || "GENERAL",
        bodyText,
        variablesList: typeof variablesList === "string" ? variablesList : JSON.stringify(variablesList || []),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
