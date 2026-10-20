import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { records, batchTag, customSource, assignVolunteerIds } = await request.json();
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid records payload" }, { status: 400 });
    }

    let imported = 0;
    let duplicates = 0;
    let updated = 0;

    const hasVolunteers = Array.isArray(assignVolunteerIds) && assignVolunteerIds.length > 0;

    for (const item of records) {
      // Find mobile from various column names
      const mobileRaw = item["Mobile"] || item["Mobile Number"] || item["Phone"] || item["mobile"];
      if (!mobileRaw) continue;

      const cleanMobile = String(mobileRaw).replace(/[^0-9]/g, "").slice(-10);
      if (cleanMobile.length < 10) continue;

      const fullName = item["Name"] || item["Full Name"] || item["fullName"] || "Devotee";
      const area = item["Area"] || item["Locality"] || item["area"] || "Chandkheda";
      const source = customSource || item["Source"] || item["source"] || "Excel Import";
      const profession = item["Profession"] || item["Occupation"] || "";
      const tags = batchTag || item["Tags"] || item["tags"] || null;

      // Check duplicate
      const exists = await prisma.person.findUnique({
        where: { mobile: cleanMobile },
      });

      if (exists) {
        // If importing for calling with volunteer assignment or batch tag, update existing record
        const updateData: any = {};
        if (hasVolunteers) {
          updateData.assignedVolunteerId = assignVolunteerIds[(imported + updated) % assignVolunteerIds.length];
        }
        if (tags) {
          const currentTags = exists.tags ? exists.tags.split(",").map((t: string) => t.trim()) : [];
          if (!currentTags.includes(tags.trim())) {
            currentTags.push(tags.trim());
            updateData.tags = currentTags.join(", ");
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.person.update({
            where: { id: exists.id },
            data: updateData,
          });

          await prisma.timelineEvent.create({
            data: {
              personId: exists.id,
              eventType: "NOTE",
              title: "Calling List Updated via Import",
              description: `Updated with source '${source}'${tags ? ` • Batch: '${tags}'` : ""}${updateData.assignedVolunteerId ? " • Assigned to caller" : ""}`,
            },
          });

          updated++;
        } else {
          duplicates++;
        }
      } else {
        const assignedVolunteerId = hasVolunteers
          ? assignVolunteerIds[(imported + updated) % assignVolunteerIds.length]
          : null;

        const p = await prisma.person.create({
          data: {
            fullName,
            mobile: cleanMobile,
            whatsappNumber: cleanMobile,
            area,
            source,
            profession,
            tags,
            assignedVolunteerId,
            stage: "New Person",
          },
        });

        await prisma.timelineEvent.create({
          data: {
            personId: p.id,
            eventType: "NOTE",
            title: "Imported via Excel / CSV",
            description: `Imported with source '${source}'${tags ? ` • Batch: '${tags}'` : ""}${assignedVolunteerId ? " • Auto-assigned to caller" : ""}`,
          },
        });

        imported++;
      }
    }

    return NextResponse.json({ imported, duplicates, updated });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
