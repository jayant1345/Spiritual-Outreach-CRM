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

            <div className="pt-3 border-t border-[#E5D8B8]/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#08415C]/80">
                👥 {course._count?.enrollments || course.enrollments?.length || 0} Enrolled
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <span>⚡ Fatafat Check-In</span>
                </Link>
                <Link
                  href={`/courses/${course.id}`}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#08415C] text-xs font-medium rounded-xl border border-[#D4AF37]/50 shadow-sm flex items-center gap-1 transition"
                >
                  <span>Full Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#78909C]" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
