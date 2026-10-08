import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !hasPermission(currentUser, "courses:manage")) {
      return NextResponse.json({ error: "Unauthorized. Courses management permission required." }, { status: 403 });
    }

    const { batchId, records } = await request.json();

    if (!batchId || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "Batch ID and rows array are required" }, { status: 400 });
    }

    const batch = await prisma.courseBatch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const batchTag = batch.batchName.trim();
    let newMembers = 0;
    let existingMembers = 0;
    let alreadyEnrolled = 0;
    let skippedInvalid = 0;

    for (const item of records) {
      // Find mobile from multiple possible column keys
      const rawMobile =
        item["Mobile"] ||
        item["Mobile Number"] ||
        item["Phone"] ||
        item["phone"] ||
        item["mobile"] ||
        item["Contact"] ||
        item["WhatsApp"] ||
        item["WhatsApp Number"];

      if (!rawMobile) {
        skippedInvalid++;
        continue;
      }

      const cleanMobile = String(rawMobile).replace(/[^0-9]/g, "").slice(-10);
      if (cleanMobile.length < 10) {
        skippedInvalid++;
        continue;
      }

      const fullName =
        item["Name"] ||
        item["Full Name"] ||
        item["Student Name"] ||
        item["Devotee Name"] ||
        item["fullName"] ||
        "Devotee";

      const area = item["Area"] || item["Locality"] || item["City"] || item["area"] || "Chandkheda";
      const profession = item["Profession"] || item["Occupation"] || "";
      const ageGroup = item["Age Group"] || item["Age"] || "";

      // Check if person exists in master directory
      let person = await prisma.person.findUnique({
        where: { mobile: cleanMobile },
      });

      if (person) {
        // Person already exists: tag them with batch name
        const existingTags = person.tags
          ? person.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
        if (!existingTags.includes(batchTag)) {
          existingTags.push(batchTag);
          person = await prisma.person.update({
            where: { id: person.id },
            data: { tags: existingTags.join(", ") },
          });
        }

        // Check if already enrolled in this batch
        const enr = await prisma.courseEnrollment.findFirst({
          where: { personId: person.id, batchId },
        });

        if (enr) {
          alreadyEnrolled++;
        } else {
          await prisma.courseEnrollment.create({
            data: {
              personId: person.id,
              courseId: batch.courseId,
              batchId,
              status: "ACTIVE",
              attendancePercent: 0,
            },
          });

          await prisma.timelineEvent.create({
            data: {
              personId: person.id,
              eventType: "COURSE_ENROLL",
              title: `Enrolled in ${batch.course.title} (${batch.batchName})`,
              description: `Enrolled via Excel Batch Import by ${currentUser.name}. Tagged '${batchTag}'.`,
              createdByUserId: currentUser.id,
            },
          });

          existingMembers++;
        }
      } else {
        // Create new devotee and enroll
        const newPerson = await prisma.person.create({
          data: {
            fullName,
            mobile: cleanMobile,
            whatsappNumber: cleanMobile,
            area,
            profession,
            ageGroup,
            source: `${batch.course.title} - ${batch.batchName}`,
            tags: batchTag,
            stage: "New Person",
          },
        });

        await prisma.courseEnrollment.create({
          data: {
            personId: newPerson.id,
            courseId: batch.courseId,
            batchId,
            status: "ACTIVE",
            attendancePercent: 0,
          },
        });

        await prisma.timelineEvent.create({
          data: {
            personId: newPerson.id,
            eventType: "COURSE_ENROLL",
            title: `Registered & Enrolled in ${batch.course.title} (${batch.batchName})`,
            description: `Registered and enrolled via Excel Batch Import by ${currentUser.name}.`,
            createdByUserId: currentUser.id,
          },
        });

        newMembers++;
      }
    }

    return NextResponse.json({
      success: true,
      batchName: batch.batchName,
      enrolled: newMembers + existingMembers,
      newMembers,
      existingMembers,
      alreadyEnrolled,
      skippedInvalid,
      message: `Enrolled ${newMembers + existingMembers} devotees into ${batch.batchName} (${newMembers} newly registered, ${existingMembers} existing directory members linked).`,
    });
  } catch (error: any) {
    console.error("Batch Excel import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
