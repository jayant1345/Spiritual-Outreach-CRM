"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CRMContext } from "@/components/layout/RootShell";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
  Layers,
  CheckSquare,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Building2,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCallingVolunteer } = useAuth();
  const {
    selectedCourseId,
    selectedBatchIds,
    activeCourseTitle,
    activeBatchSummary,
    selectedCourse,
  } = useWorkspace();

  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [activeQueueTab, setActiveQueueTab] = useState<"today" | "callbacks" | "absentee">("today");

  // Calling Volunteer Journey: redirect directly to My Calling Desk
  useEffect(() => {
    if (user && isCallingVolunteer) {
      router.replace("/calling-sewa");
    }
  }, [user, isCallingVolunteer, router]);

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
      const queryParams = new URLSearchParams({
        month: selectedMonth,
        courseId: selectedCourseId,
        batchIds: selectedBatchIds.join(","),
        scope: "all",
      });

      const res = await fetch(`/api/stats?${queryParams.toString()}`);
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
  }, [refreshTrigger, selectedMonth, selectedCourseId, selectedBatchIds]);

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
  const batchPerformance = currentStats.batchPerformance || [];
  const volunteerPerformance = currentStats.volunteerPerformance || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ACTIVE WORKSPACE BANNER (Course & Batch Focus Indicator) - Visible on Desktop, Moved to Menu on Mobile to maximize screen space */}
      <div className="hidden md:flex bg-gradient-to-r from-white via-[#FAF5E6]/60 to-white p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37] shadow-xs flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#08415C] text-white">
                Active Workspace
              </span>
              <span className="text-xs font-semibold text-stone-500">•</span>
              <span className="text-xs font-bold text-[#08415C]">
                {activeCourseTitle}
              </span>
              <span className="text-xs font-semibold text-stone-500">•</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#00A896]" />
                <span>{activeBatchSummary}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Dashboard figures, pending follow-ups, and calling metrics are filtered for this spiritual cohort.
            </p>
          </div>
        </div>

        {/* Change Course / Batch Button */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => router.push("/select-batch")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#D4AF37] text-[#08415C] hover:bg-[#FAF5E6] transition text-xs font-bold shadow-2xs"
          >
            <span>⚡ Change Course / Batches</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#B8860B]" />
          </button>
        </div>
      </div>

      {/* Header Banner & Monthly Filter Control - Compact on Mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
            <span>🪷 Sri Sri Radha Govind Seva</span>
            <span>•</span>
            <span>Chandkheda Center</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-[#08415C] mt-0.5 tracking-tight truncate">
            Devotee Outreach & Relationship Cockpit
          </h2>
          {/* Subtle mobile active cohort indicator */}
          <div className="md:hidden flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mt-0.5 truncate">
            <span className="font-semibold text-[#08415C] truncate">{activeCourseTitle}</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600 truncate">{activeBatchSummary}</span>
          </div>
        </div>

        {/* Monthly Filter Selector (Compact on mobile) */}
        <div className="flex items-center self-start sm:self-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white border border-[#E5D8B8] rounded-xl shadow-2xs text-[11px] sm:text-xs font-medium">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#08415C] flex-shrink-0" />
            <span className="text-stone-400 hidden sm:inline">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-[#08415C] outline-none text-[11px] sm:text-xs cursor-pointer"
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

      {/* STEP 4 PRD: 6 SPECIFIC METRIC KPI CARDS - Compact & Simple on Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5">
        {/* Metric 1: Total Contacts */}
        <Link
          href="/people"
          className="gold-card p-2 sm:p-3.5 hover:border-[#08415C] transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-[#08415C]"
          title="Total Contacts in workspace"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Total Contacts
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#08415C]/10 text-[#08415C] flex items-center justify-center flex-shrink-0">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#08415C]">
              {currentStats.totalContacts ?? currentStats.totalPeople ?? 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">In this workspace</div>
          </div>
          <div className="text-[10px] text-[#08415C] font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View contacts</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>

        {/* Metric 2: Total Assigned Contacts */}
        <Link
          href="/calling-sewa"
          className="gold-card p-2 sm:p-3.5 hover:border-[#00A896] transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-[#00A896]"
          title="Contacts assigned to volunteers"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Assigned
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-emerald-50 text-[#00A896] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#00A896]">
              {currentStats.totalAssignedContacts || 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">Allocated callers</div>
          </div>
          <div className="text-[10px] text-[#00A896] font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Assign calls</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>

        {/* Metric 3: Total Pending Calls */}
        <Link
          href="/calling-sewa"
          className="gold-card p-2 sm:p-3.5 hover:border-[#D4AF37] transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-[#D4AF37]"
          title="Total pending follow-up calls"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Pending Calls
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center flex-shrink-0">
              <PhoneCall className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#08415C]">
              {currentStats.totalPendingCalls ?? currentStats.callsPending ?? 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">Calls due</div>
          </div>
          <div className="text-[10px] text-[#B8860B] font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Calling desk</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>

        {/* Metric 4: Today's Follow-ups */}
        <Link
          href="/todays-work"
          className="gold-card p-2 sm:p-3.5 hover:border-indigo-600 transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-indigo-600"
          title="Follow-ups due today"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Today's Calls
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-indigo-900">
              {currentStats.todayFollowups || 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">Due today</div>
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Today's work</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>

        {/* Metric 5: Interested Devotees */}
        <Link
          href="/people?filter=interested"
          className="gold-card p-2 sm:p-3.5 hover:border-amber-600 transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-amber-500"
          title="Interested Devotees"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Interested
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-amber-700">
              {currentStats.interestedDevotees || 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">Positive responses</div>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>View seekers</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>

        {/* Metric 6: Registered Devotees */}
        <Link
          href="/courses"
          className="gold-card p-2 sm:p-3.5 hover:border-[#08415C] transition flex flex-col justify-between group shadow-2xs sm:shadow-xs cursor-pointer border-t-2 sm:border-t-3 border-t-[#08415C]"
          title="Registered Devotees in course"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#78909C] uppercase tracking-wider truncate">
              Registered
            </span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-[#08415C]/10 text-[#08415C] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
          <div className="my-0.5 sm:my-1.5">
            <div className="text-lg sm:text-2xl font-serif font-bold text-[#08415C]">
              {currentStats.registeredDevotees || 0}
            </div>
            <div className="text-[10px] text-stone-500 hidden sm:block">Enrolled devotees</div>
          </div>
          <div className="text-[10px] text-[#08415C] font-semibold hidden sm:flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Course roster</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </Link>
      </div>

      {/* STEP 4 PRD: BATCH-WISE PERFORMANCE & VOLUNTEER-WISE PERFORMANCE SECTIONS */}
      {batchPerformance.length > 0 && (
        <div className="gold-card p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D8B8]/70 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00A896]" />
                <span>Batch-Wise Performance (Step 4)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Performance indicators across batches in {activeCourseTitle}
              </p>
            </div>
            <Link
              href="/reports"
              className="text-xs font-semibold text-[#08415C] hover:underline flex items-center gap-1"
            >
              <span>View full reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {batchPerformance.map((batch: any) => (
              <div
                key={batch.id}
                className="p-3.5 rounded-xl bg-white border border-[#E5D8B8] shadow-2xs hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-[#08415C] truncate">
                    {batch.batchName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {batch.attendanceRate}% Attendance
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-3">{batch.scheduleInfo || "Weekly Schedule"}</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-stone-100">
                  <div className="p-1 rounded bg-stone-50">
                    <span className="text-[10px] text-stone-500 block">Enrolled</span>
                    <span className="font-bold text-stone-800">{batch.enrolledCount}</span>
                  </div>
                  <div className="p-1 rounded bg-emerald-50/50">
                    <span className="text-[10px] text-emerald-700 block">Completed</span>
                    <span className="font-bold text-emerald-800">{batch.completedCalls}</span>
                  </div>
                  <div className="p-1 rounded bg-amber-50/50">
                    <span className="text-[10px] text-amber-700 block">Pending</span>
                    <span className="font-bold text-amber-800">{batch.pendingCalls}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VOLUNTEER-WISE PERFORMANCE SECTION (PRD STEP 4) */}
      {volunteerPerformance.length > 0 && (
        <div className="gold-card p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D8B8]/70 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span>Volunteer-Wise Performance (Step 4)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Calling output, assigned contacts, and positive responses per volunteer
              </p>
            </div>
            <Link
              href="/volunteers"
              className="text-xs font-semibold text-[#08415C] hover:underline flex items-center gap-1"
            >
              <span>Manage volunteers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-600 font-semibold border-b border-[#E5D8B8]">
                <tr>
                  <th className="py-2.5 px-3">Volunteer</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Assigned Contacts</th>
                  <th className="py-2.5 px-3 text-center">Calls Made</th>
                  <th className="py-2.5 px-3 text-center">Pending Calls</th>
                  <th className="py-2.5 px-3 text-center">Interested / Will Attend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {volunteerPerformance.map((v: any) => (
                  <tr key={v.id} className="hover:bg-stone-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{v.name}</td>
                    <td className="py-2.5 px-3 text-stone-500 text-[11px]">{v.role?.replace(/_/g, " ")}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-stone-800">{v.assignedCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{v.completedCalls}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-700">{v.pendingCalls}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#08415C]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                        {v.positiveResponses} Devotees
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  Follow-ups
                </button>
              </div>
            </div>

            {/* Calling Cards List */}
            <div className="space-y-2.5">
              {(currentStats.priorityCalls || []).map((person: any) => (
                <div
                  key={person.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-[#E5D8B8]/80 bg-white/70 hover:bg-white transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs group"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => openPersonModal(person.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#0B192C] group-hover:text-[#08415C]">
                        {person.fullName}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF5E6] text-[#B8860B] border border-[#E5D8B8]">
                        {person.stage || "New Seeker"}
                      </span>
                      {person.assignedVolunteer && (
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                          Caller: {person.assignedVolunteer.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                      <span>📱 {person.mobile}</span>
                      {person.area && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {person.area}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openWhatsAppModal(person)}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                      title="Send WhatsApp Message"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCallModal(person)}
                      className="px-3 py-1.5 rounded-lg bg-[#08415C] text-white hover:bg-[#063349] transition text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  </div>
                </div>
              ))}

              {(!currentStats.priorityCalls || currentStats.priorityCalls.length === 0) && (
                <div className="p-8 text-center text-stone-400 text-xs">
                  No pending calls in this cohort right now.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Recent Seva Activity Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="gold-card p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5D8B8]/70 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D4AF37]" />
                  Recent Seva Activity
                </h3>
                <p className="text-[11px] sm:text-xs text-[#78909C]">
                  Live feed: who performed each seva
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {(currentStats.recentTimeline || []).map((event: any) => (
                <div key={event.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-stone-800">
                      {event.createdByUser?.name ? (
                        <strong className="text-[#08415C]">{event.createdByUser.name} </strong>
                      ) : null}
                      <span>{event.title}</span>
                    </div>
                    {event.person && (
                      <div className="text-[11px] text-stone-500">
                        Devotee: <strong>{event.person.fullName}</strong> ({event.person.mobile})
                      </div>
                    )}
                    <span className="text-[10px] text-stone-400">
                      {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {(!currentStats.recentTimeline || currentStats.recentTimeline.length === 0) && (
                <div className="p-8 text-center text-stone-400 text-xs">
                  No seva activity logged yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
