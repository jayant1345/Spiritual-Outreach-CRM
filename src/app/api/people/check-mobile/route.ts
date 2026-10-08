import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawMobile = searchParams.get("mobile") || "";
    const cleanMobile = rawMobile.replace(/[^0-9]/g, "").slice(-10);

    if (cleanMobile.length < 10) {
      return NextResponse.json({ exists: false });
    }

    const existing = await prisma.person.findFirst({
      where: {
        OR: [
          { mobile: { endsWith: cleanMobile } },
          { whatsappNumber: { endsWith: cleanMobile } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        mobile: true,
        stage: true,
        area: true,
      },
    });

    if (existing) {
      return NextResponse.json({ exists: true, person: existing });
    }

    return NextResponse.json({ exists: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
