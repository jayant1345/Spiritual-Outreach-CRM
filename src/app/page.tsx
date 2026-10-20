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
  ChevronDown,
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
  BookOpen,
  Search,
  MoreVertical,
  X,
  User as UserIcon,
} from "lucide-react";

const avatarColorPalette = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-sky-100", text: "text-sky-800" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
];

const getInitials = (name: string) => {
  if (!name) return "SV";
  const cleaned = name.replace(/^(HG|HH|Prabhu|Mataji)\s+/i, "");
  const parts = cleaned.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const originalParts = name.trim().split(/\s+/);
  if (originalParts.length >= 2) {
    return (originalParts[0][0] + originalParts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCallingVolunteer } = useAuth();
  const {
    selectedCourseId,
    selectedBatchIds,
    activeCourseTitle,
    activeBatchSummary,
    selectedCourse,
    courses,
    setWorkspace,
  } = useWorkspace();

  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");
  const [selectedCallerFilter, setSelectedCallerFilter] = useState<string>("ALL");
  const [searchCallerQuery, setSearchCallerQuery] = useState<string>("");
  const [showCallerSearch, setShowCallerSearch] = useState<boolean>(false);
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

      {/* Top Center Identity & Avatar Header (Matches Admin Screenshot) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200/60 flex items-center justify-center text-xl shadow-2xs">
            🪷
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-serif font-bold text-[#08415C] tracking-wide uppercase leading-tight">
              Sri Sri Radha Govind Seva
            </h1>
            <p className="text-[10px] tracking-widest text-[#B8860B] font-semibold uppercase">
              Chandkheda Center
            </p>
          </div>
        </div>

        {/* User Avatar Circle on Top Right */}
        {user && (
          <div
            onClick={() => router.push("/profile")}
            className="flex items-center gap-1.5 bg-white border border-[#E5D8B8] pl-1 pr-2 py-1 rounded-full shadow-2xs cursor-pointer hover:border-[#08415C] transition"
            title={`Logged in as ${user.name}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#08415C] text-[#D4AF37] text-[11px] font-bold flex items-center justify-center shadow-2xs">
              {getInitials(user.name || "Sevak")}
            </div>
            <span className="text-xs font-bold text-[#08415C] hidden sm:inline max-w-[100px] truncate">
              {user.name?.split(" ")[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </div>
        )}
      </div>

      {/* COMPACT FILTER CONTROLS (Row 1: Calendar Month, Row 2: Caller + Batch) */}
      <div className="space-y-2">
        {/* Filter Row 1: Calendar Month */}
        <div className="relative">
          <div className="flex items-center justify-between w-full bg-white border border-[#E5D8B8] rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs hover:border-[#08415C]/40 transition">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-[#08415C] shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer font-bold text-stone-800 text-xs"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none shrink-0" />
          </div>
        </div>

        {/* Filter Row 2: All Callers (Left) & Batch (Right) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Caller Filter */}
          <div className="flex items-center justify-between bg-white border border-[#E5D8B8] rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 shadow-2xs hover:border-[#08415C]/40 transition">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <UserIcon className="w-3.5 h-3.5 text-[#08415C] shrink-0" />
              <select
                value={selectedCallerFilter}
                onChange={(e) => setSelectedCallerFilter(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer text-xs font-semibold text-stone-800 truncate"
              >
                <option value="ALL">All Callers</option>
                {volunteerPerformance.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none shrink-0" />
          </div>

          {/* Batch Filter */}
          <div className="flex items-center justify-between bg-white border border-[#E5D8B8] rounded-xl px-2.5 py-2 text-xs font-semibold text-stone-800 shadow-2xs hover:border-[#08415C]/40 transition">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-[#08415C] shrink-0" />
              <select
                value={selectedBatchIds[0] || "ALL"}
                onChange={(e) => {
                  const bId = e.target.value;
                  if (bId === "ALL") {
                    setWorkspace(selectedCourseId, []);
                  } else {
                    const parentCourse = courses.find((c) => c.batches?.some((b) => b.id === bId));
                    setWorkspace(parentCourse?.id || selectedCourseId, [bId]);
                  }
                }}
                className="w-full bg-transparent outline-none cursor-pointer text-xs font-semibold text-stone-800 truncate"
              >
                <option value="ALL">All Batches</option>
                {(selectedCourse?.batches && selectedCourse.batches.length > 0
                  ? selectedCourse.batches
                  : courses.flatMap((c) => c.batches || [])
                ).map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.batchName}
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none shrink-0" />
          </div>
        </div>
      </div>

      {/* 4 COMPACT METRIC CARDS (2x2 Grid on Mobile, 4-Col on Desktop - Exact Match to Screenshot) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Total Contacts (Soft Pastel Blue) */}
        <Link
          href="/people"
          className="p-3 sm:p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] hover:border-[#93C5FD] transition flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-[#1E3A8A] leading-tight">
                {currentStats.totalContacts ?? currentStats.totalPeople ?? 0}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-stone-500 truncate">
                Total Contacts
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#3B82F6] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>

        {/* Card 2: Calls Done (Soft Pastel Green) */}
        <Link
          href="/calling-sewa?tab=calls_done"
          className="p-3 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] hover:border-[#86EFAC] transition flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-[#14532D] leading-tight">
                {currentStats.callsCompleted || 0}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-stone-500 truncate">
                Calls Done
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#22C55E] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>

        {/* Card 3: To Call (Soft Pastel Orange/Amber) */}
        <Link
          href="/calling-sewa?tab=calling"
          className="p-3 sm:p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] hover:border-[#FCD34D] transition flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-[#78350F] leading-tight">
                {currentStats.totalPendingCalls ?? currentStats.callsPending ?? 0}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-stone-500 truncate">
                To Call
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#F59E0B] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>

        {/* Card 4: Callers (Soft Pastel Purple) */}
        <Link
          href="/volunteers"
          className="p-3 sm:p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] hover:border-[#D8B4FE] transition flex items-center justify-between group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-bold text-[#581C87] leading-tight">
                {volunteerPerformance.length}
              </div>
              <div className="text-[11px] sm:text-xs font-medium text-stone-500 truncate">
                Callers
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A855F7] group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      {/* DEVOTEE CALL LIST WITH LIVE PROGRESS BARS (Matches Admin Screenshot) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-sm sm:text-base text-[#08415C]">
            Devotee Call List ({volunteerPerformance.length})
          </h3>

          <div className="flex items-center gap-1.5">
            {showCallerSearch ? (
              <div className="flex items-center gap-1 bg-white border border-[#E5D8B8] rounded-xl px-2 py-1 shadow-2xs animate-fadeIn">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  value={searchCallerQuery}
                  onChange={(e) => setSearchCallerQuery(e.target.value)}
                  placeholder="Search caller..."
                  className="text-xs outline-none w-28 sm:w-36 text-stone-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchCallerQuery("");
                    setShowCallerSearch(false);
                  }}
                  className="text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCallerSearch(true)}
                className="p-1.5 bg-white hover:bg-stone-50 border border-[#E5D8B8] rounded-xl text-stone-600 shadow-2xs transition"
                title="Search callers"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Caller Progress Cards */}
        <div className="space-y-2">
          {volunteerPerformance
            .filter((v: any) => {
              if (selectedCallerFilter !== "ALL" && v.id !== selectedCallerFilter) return false;
              if (searchCallerQuery) {
                return v.name.toLowerCase().includes(searchCallerQuery.toLowerCase());
              }
              return true;
            })
            .map((vol: any, idx: number) => {
              const color = avatarColorPalette[idx % avatarColorPalette.length];
              const initials = getInitials(vol.name);
              const total = (vol.completedCalls || 0) + (vol.pendingCalls || 0);
              const percent = total > 0 ? Math.round(((vol.completedCalls || 0) / total) * 100) : 0;

              return (
                <div
                  key={vol.id}
                  className="p-3 sm:p-3.5 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:border-[#08415C]/40 transition flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar Circle with Initials */}
                  <div
                    className={`w-10 h-10 rounded-full ${color.bg} ${color.text} font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {initials}
                  </div>

                  {/* Center: Name, Stats, Progress Bar */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-xs sm:text-sm text-stone-800 truncate cursor-pointer hover:text-[#08415C]"
                      onClick={() => router.push(`/calling-sewa?volunteerId=${vol.id}`)}
                    >
                      {vol.name}
                    </h4>

                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1.5">
                      <span>
                        <strong className="text-blue-600 font-bold">{vol.pendingCalls || 0}</strong> to call
                      </span>
                      <span className="text-stone-300">•</span>
                      <span>
                        <strong className="text-emerald-600 font-bold">{vol.completedCalls || 0}</strong> done
                      </span>
                    </div>

                    {/* Progress Bar with Percentage */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-stone-500 min-w-[30px] text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Right: 3-dots action icon */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/calling-sewa?volunteerId=${vol.id}`)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                      title={`Open calling queue for ${vol.name}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

          {volunteerPerformance.length === 0 && (
            <div className="p-8 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
              No callers found in this workspace.
            </div>
          )}
        </div>
      </div>

      {/* STEP 4 PRD: BATCH-WISE PERFORMANCE SECTION (Collapsible / Secondary) */}
      {batchPerformance.length > 0 && (
        <div className="gold-card p-3.5 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5D8B8]/70 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#08415C] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00A896]" />
                <span>Batch-Wise Performance</span>
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
