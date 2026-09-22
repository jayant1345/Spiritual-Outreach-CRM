"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/common/Badge";
import {
  GraduationCap,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#D4AF37]" />
            Course & Academic Batch Management
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Multi-session spiritual courses with session-by-session attendance tracking, student regularity formulas, and absentee follow-ups
          </p>
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const stats = course.stats || {
            totalStudents: 50,
            regularCount: 38,
            irregularCount: 7,
            lowCount: 3,
          };

          return (
            <div key={course.id} className="gold-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={course.status === "ACTIVE" ? "emerald" : "neutral"}>
                  {course.status}
                </Badge>
                <span className="text-xs font-semibold text-[#B8860B]">
                  {course.totalSessions} Sessions Total
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-xl text-[#08415C]">
                  {course.title}
                </h3>
                <p className="text-xs text-[#78909C] mt-1">
                  Faculty: <strong>{course.facultyName || "HG Radheshyam Das"}</strong> • Venue: {course.venue}
                </p>
              </div>

              {/* Regularity KPI Pills */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#08415C]">
                  <span>Student Regularity Breakdown:</span>
                  <span>{stats.totalStudents} Enrolled</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-300">
                    <div className="font-bold text-emerald-800 text-base">{stats.regularCount}</div>
                    <div className="text-[10px] text-emerald-700">Regular (≥75%)</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-300">
                    <div className="font-bold text-amber-800 text-base">{stats.irregularCount}</div>
                    <div className="text-[10px] text-amber-700">Irregular (50-74%)</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <div className="font-bold text-red-800 text-base">{stats.lowCount}</div>
                    <div className="text-[10px] text-red-700">Low (&lt;50%)</div>
                  </div>
                </div>
              </div>

              {/* Enter Matrix CTA */}
              <div className="pt-2 border-t border-[#E5D8B8]/60 flex items-center justify-between">
                <span className="text-xs text-[#78909C]">
                  Batch 1 (Saturday Evening 6:30 PM)
                </span>
                <Link
                  href={`/courses/${course.id}`}
                  className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
                >
                  <TableProperties className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Open Attendance Matrix</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
