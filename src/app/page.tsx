"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  Users,
  PhoneCall,
  CalendarDays,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  MapPin,
  Flame,
  Calendar,
  Filter,
} from "lucide-react";

export default function DashboardPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [activeQueueTab, setActiveQueueTab] = useState<"today" | "callbacks" | "absentee">("today");

  const monthOptions = [
    { value: "2026-10", label: "October 2026 (Current)" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "ALL", label: "All Time (Cumulative)" },
  ];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stats?month=${selectedMonth}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger, selectedMonth]);

  if (loading && !stats) {
    return (
      <div className="py-24 text-center text-[#78909C]">
        <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-3">🪷</div>
        <p className="text-sm font-semibold text-[#08415C]">
          Loading Chandkheda Devotee Care Cockpit...
        </p>
      </div>
    );
  }

  const currentStats = stats || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner & Monthly Filter Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
            <span>🪷 Sri Sri Radha Govind Seva</span>
            <span>•</span>
            <span>Chandkheda Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] mt-0.5">
            Devotee Outreach & Relationship Cockpit
          </h2>
        </div>

        {/* Monthly Filter Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl shadow-xs text-xs font-medium w-full sm:w-auto">
            <Calendar className="w-3.5 h-3.5 text-[#08415C]" />
            <span className="text-stone-500 hidden sm:inline">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-[#08415C] outline-none text-xs cursor-pointer flex-1"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Clickable Report/Statistics KPI Cards (Compact & Mobile-Optimized) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Members -> Click opens /people */}
        <Link
          href="/people"
          className="gold-card p-3 sm:p-4 hover:border-[#08415C] transition flex flex-col justify-between group shadow-xs cursor-pointer border-t-3 border-t-[#08415C]"
          title="Click to view full Members directory"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#78909C] uppercase tracking-wider truncate">
              Total Members
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#08415C]/10 text-[#08415C] flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
              {currentStats.totalPeople || 0}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-[#00A896]">
              +{currentStats.newMembersThisMonth || 12} this period
            </div>
          </div>
          <div className="text-[10px] text-[#08415C] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View directory</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 2: Today's Calling Sewa -> Click opens /calling-sewa */}
        <Link
          href="/calling-sewa"
          className="gold-card p-3 sm:p-4 hover:border-[#D4AF37] transition flex flex-col justify-between group shadow-xs cursor-pointer border-t-3 border-t-[#D4AF37]"
          title="Click to open Calling Sewa Desk"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#78909C] uppercase tracking-wider truncate">
              Calling Queue
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
              {currentStats.callsPending || 0} <span className="text-xs font-sans text-stone-500 font-normal">Due</span>
            </div>
            <div className="text-[10px] sm:text-xs text-stone-500">
              {currentStats.callsCompleted || 0} calls completed
            </div>
          </div>
          <div className="text-[10px] text-[#B8860B] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Open calling desk</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 3: Courses & Batches -> Click opens /courses */}
        <Link
          href="/courses"
          className="gold-card p-3 sm:p-4 hover:border-[#00A896] transition flex flex-col justify-between group shadow-xs cursor-pointer border-t-3 border-t-[#00A896]"
          title="Click to view Courses & Batches"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#78909C] uppercase tracking-wider truncate">
              Course Students
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-[#00A896] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
              {currentStats.courseStudents || 0} <span className="text-xs font-sans text-stone-500 font-normal">Enrolled</span>
            </div>
            <div className="text-[10px] sm:text-xs text-stone-500">
              {currentStats.activeCourses || 1} active courses
            </div>
          </div>
          <div className="text-[10px] text-[#00A896] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View courses</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 4: Attendance Matrix -> Click opens /attendance */}
        <Link
          href="/attendance"
          className="gold-card p-3 sm:p-4 hover:border-[#08415C] transition flex flex-col justify-between group shadow-xs cursor-pointer border-t-3 border-t-[#0B4F6C]"
          title="Click to open Attendance Matrix"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#78909C] uppercase tracking-wider truncate">
              Attendance Health
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="my-1.5 sm:my-2">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
              {currentStats.regularCount || 0} <span className="text-xs font-sans text-emerald-600 font-normal">Regular</span>
            </div>
            <div className="text-[10px] sm:text-xs text-amber-700">
              {currentStats.irregularCount || 0} need follow-up
            </div>
          </div>
          <div className="text-[10px] text-[#08415C] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Attendance grid</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Operational Sections: Left Queue (Priority Calls) + Right Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column (7 Cols): Calling & Devotee Care Priority Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="gold-card p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[#E5D8B8]/70 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                  Priority Calling & Follow-up Queue
                </h3>
                <p className="text-[11px] sm:text-xs text-[#78909C]">
                  Personalized outreach & follow-up queue for volunteers
                </p>
              </div>

              {/* Queue Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveQueueTab("today")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    activeQueueTab === "today"
                      ? "bg-[#08415C] text-white font-semibold shadow-xs"
                      : "text-stone-600 hover:bg-white"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueTab("callbacks")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    activeQueueTab === "callbacks"
                      ? "bg-[#08415C] text-white font-semibold shadow-xs"
                      : "text-stone-600 hover:bg-white"
                  }`}
                >
                  Callbacks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueTab("absentee")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                    activeQueueTab === "absentee"
                      ? "bg-[#08415C] text-white font-semibold shadow-xs"
                      : "text-stone-600 hover:bg-white"
                  }`}
                >
                  Absentee
                </button>
              </div>
            </div>

            {/* Devotee Cards List */}
            <div className="space-y-2 sm:space-y-3">
              {currentStats.priorityCalls && currentStats.priorityCalls.length > 0 ? (
                currentStats.priorityCalls.map((person: any) => (
                  <div
                    key={person.id}
                    className="p-3 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#D4AF37] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 group shadow-xs"
                  >
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => openPersonModal(person.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#08415C] group-hover:text-[#0B4F6C]">
                          {person.fullName}
                        </span>
                        <Badge variant="morpankh" size="sm">{person.stage}</Badge>
                        {person.area && (
                          <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-[#D4AF37]" /> {person.area}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                        {person.mobile} • {person.notes || `Assigned: ${person.assignedVolunteer?.name || "Caller"}`}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openCallModal(person)}
                        className="px-2.5 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1 transition"
                        title="Click to Dial"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> <span>Call</span>
                      </button>
                      <button
                        onClick={() => openWhatsAppModal(person)}
                        className="px-2.5 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-xs flex items-center gap-1 transition"
                        title="Send WhatsApp Template"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-stone-500">
                  All calling queue tasks completed! Haribol!
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-stone-500">
              <span>Showing priority items</span>
              <Link
                href="/calling-sewa"
                className="font-semibold text-[#08415C] hover:text-[#B8860B] flex items-center gap-1"
              >
                <span>Full Calling & Follow-up Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Course Batch Attendance Summary & Live Activity */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Course Regularity Card -> Clickable to /attendance */}
          <Link
            href="/attendance"
            className="gold-card p-3.5 sm:p-4 space-y-2.5 block hover:border-[#08415C] transition shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#08415C] uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#08415C]" /> Batch Attendance Overview
              </span>
              <Badge variant="morpankh" size="sm">Gita Shiksha</Badge>
            </div>

            <h4 className="font-serif font-bold text-sm sm:text-base text-[#08415C]">
              Batch Regularity Breakdown
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg">
                <div className="font-bold text-emerald-800 text-sm sm:text-base">{currentStats.regularCount || 38}</div>
                <div className="text-[10px] text-emerald-700">Regular (≥75%)</div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg">
                <div className="font-bold text-amber-800 text-sm sm:text-base">{currentStats.irregularCount || 7}</div>
                <div className="text-[10px] text-amber-700">Irregular (50-74%)</div>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="font-bold text-rose-800 text-sm sm:text-base">{currentStats.lowCount || 3}</div>
                <div className="text-[10px] text-rose-700">Low (&lt;50%)</div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5D8B8]/60 flex items-center justify-between text-xs text-[#08415C] font-semibold">
              <span>Open Attendance Matrix</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Live Seva Activity Stream */}
          <div className="gold-card p-3.5 sm:p-4 space-y-2.5 shadow-xs">
            <h4 className="font-serif font-bold text-xs sm:text-sm text-[#08415C] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#D9480F]" /> Recent Seva Activity Stream
            </h4>
            <div className="space-y-2 text-xs">
              {currentStats.recentTimeline && currentStats.recentTimeline.slice(0, 4).map((item: any) => (
                <div key={item.id} className="p-2 bg-[#FAF8F5] border border-[#E5D8B8] rounded-lg">
                  <div className="flex items-center justify-between text-[11px] text-[#78909C]">
                    <span className="font-semibold text-[#08415C]">{item.person?.fullName}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-stone-700 mt-0.5 line-clamp-1">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
