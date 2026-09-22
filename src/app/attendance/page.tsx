"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/common/Badge";
import { TableProperties, ArrowRight, GraduationCap } from "lucide-react";

export default function AttendanceHubPage() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <TableProperties className="w-6 h-6 text-[#D4AF37]" />
          Attendance & Regularity Hub
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Select an active course batch to open the interactive session-by-session attendance matrix
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="gold-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="emerald">{course.status}</Badge>
              <span className="text-xs text-[#78909C]">
                {course.totalSessions} Sessions
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg text-[#08415C]">
              {course.title}
            </h3>
            <p className="text-xs text-[#78909C]">
              Faculty: {course.facultyName} • Venue: {course.venue}
            </p>

            <div className="pt-2 border-t border-[#E5D8B8]/60 flex justify-end">
              <Link
                href={`/courses/${course.id}`}
                className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
              >
                <span>Launch Attendance Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
