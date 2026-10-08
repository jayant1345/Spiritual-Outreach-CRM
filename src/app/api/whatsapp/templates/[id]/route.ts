import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, category, bodyText, variablesList, active } = body;

    const updated = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(bodyText !== undefined && { bodyText }),
        ...(variablesList !== undefined && {
          variablesList:
            typeof variablesList === "string"
              ? variablesList
              : JSON.stringify(variablesList),
        }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if it has any logs
    const logCount = await prisma.whatsAppLog.count({
      where: { templateId: id },
    });

    if (logCount > 0) {
      // Soft-delete so foreign key history is preserved
      await prisma.whatsAppTemplate.update({
        where: { id },
        data: { active: false },
      });
    } else {
      await prisma.whatsAppTemplate.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true, message: "Template removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
