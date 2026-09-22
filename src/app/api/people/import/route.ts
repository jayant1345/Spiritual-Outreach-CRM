import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { records } = await request.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid records payload" }, { status: 400 });
    }

    let imported = 0;
    let duplicates = 0;

    for (const item of records) {
      // Find mobile from various column names
      const mobileRaw = item["Mobile"] || item["Mobile Number"] || item["Phone"] || item["mobile"];
      if (!mobileRaw) continue;

      const cleanMobile = String(mobileRaw).replace(/[^0-9]/g, "").slice(-10);
      if (cleanMobile.length < 10) continue;

      const fullName = item["Name"] || item["Full Name"] || item["fullName"] || "Devotee";
      const area = item["Area"] || item["Locality"] || item["area"] || "Chandkheda";
      const source = item["Source"] || item["source"] || "Excel Import";
      const profession = item["Profession"] || item["Occupation"] || "";

      // Check duplicate
      const exists = await prisma.person.findUnique({
        where: { mobile: cleanMobile },
      });

      if (exists) {
        duplicates++;
      } else {
        const p = await prisma.person.create({
          data: {
            fullName,
            mobile: cleanMobile,
            whatsappNumber: cleanMobile,
            area,
            source,
            profession,
            stage: "New Person",
          },
        });

        await prisma.timelineEvent.create({
          data: {
            personId: p.id,
            eventType: "NOTE",
            title: "Imported via Excel / CSV",
            description: `Imported with source '${source}'`,
          },
        });

        imported++;
      }
    }

    return NextResponse.json({ imported, duplicates });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
