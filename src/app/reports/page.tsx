"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Badge from "@/components/common/Badge";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Users,
  PhoneCall,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Layers,
  ChevronRight,
  Filter,
  GraduationCap,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-10");

  // View modes: "compact" (Overview) vs "detailed"
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("compact");

  // Detailed sub-tabs: "attendance" | "calling" | "response"
  const [detailedTab, setDetailedTab] = useState<"attendance" | "calling" | "response">("attendance");

  const monthOptions = [
    { value: "2026-10", label: "October 2026 (Current)" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "ALL", label: "All Time (Cumulative)" },
  ];

  useEffect(() => {
    fetchReport();
  }, [selectedCourseId, selectedBatchId, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId !== "ALL") params.append("courseId", selectedCourseId);
      if (selectedBatchId !== "ALL") params.append("batchId", selectedBatchId);
      if (selectedMonth) params.append("month", selectedMonth);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFullReport = () => {
    if (!reportData) return;

    // Sheet 1: Summary & Attendance by Date
    const attendanceRows = (reportData.attendanceByDate || []).map((row: any) => ({
      "Date": row.dateFormatted,
      "Course": row.courseTitle,
      "Batch": row.batchName,
      "Session": `S${row.sessionNumber} - ${row.title}`,
      "Present Devotees": row.presentCount,
      "Absent": row.absentCount,
      "Total Registered": row.total,
      "Attendance %": `${row.attendancePercent}%`,
    }));

    // Sheet 2: Calling Performance by Caller
    const callerRows = (reportData.callingByVolunteer || []).map((c: any) => ({
      "Volunteer Name": c.name,
      "Total Calls": c.totalCalls,
      "Connected Calls": c.connectedCalls,
      "RSVP Yes (Interested)": c.yesCount,
      "Success Rate %": c.totalCalls > 0 ? `${Math.round((c.yesCount / c.totalCalls) * 100)}%` : "0%",
    }));

    // Sheet 3: Response Breakdown
    const responseRows = (reportData.responseBreakdown || []).map((r: any) => ({
      "Response Type": r.label,
      "Count": r.count,
      "Share %": `${r.percent}%`,
    }));

    const wb = XLSX.utils.book_new();

    if (attendanceRows.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(attendanceRows);
      XLSX.utils.book_append_sheet(wb, ws1, "Attendance by Day");
    }

    if (callerRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(callerRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Calls by Volunteer");
    }

    if (responseRows.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(responseRows);
      XLSX.utils.book_append_sheet(wb, ws3, "Call Responses");
    }

    XLSX.writeFile(wb, `Chandkheda_CRM_Report_${selectedMonth}.xlsx`);
  };

  const summary = reportData?.summary || {
    totalMembers: 0,
    totalCalls: 0,
    interestedCount: 0,
    interestedPercent: 0,
    registeredCount: 0,
    regularCount: 0,
    irregularCount: 0,
    criticalCount: 0,
    attendanceHealthPercent: 75,
  };

  const availableCourses = reportData?.availableCourses || [];
  const selectedCourseObj = availableCourses.find((c: any) => c.id === selectedCourseId);
  const availableBatches = selectedCourseObj?.batches || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Banner & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
            <span>🪷 Sri Sri Radha Govind Seva</span>
            <span>•</span>
            <span>Reports &amp; Analytics Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] mt-0.5">
            Devotee Attendance &amp; Outreach Reports
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78909C] mt-0.5">
            {reportData?.isAdmin
              ? "Admin View: Complete center reports across all batches, courses, and callers"
              : `Team Leader / Volunteer View: Showing data for ${user?.name || "your assigned batches"}`}
          </p>
        </div>

        <button
          onClick={handleDownloadFullReport}
          className="px-3.5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition flex-shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Filter Bar (Course, Batch, Month/Period) */}
      <div className="p-3 bg-white border border-[#E5D8B8] rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1 min-w-[280px]">
          {/* Course Selector */}
          <div className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center gap-2 flex-1 sm:flex-initial">
            <GraduationCap className="w-3.5 h-3.5 text-[#08415C]" />
            <span className="text-stone-500 font-medium hidden sm:inline">Course:</span>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedBatchId("ALL");
              }}
              className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Courses</option>
              {availableCourses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center gap-2 flex-1 sm:flex-initial">
            <Layers className="w-3.5 h-3.5 text-[#08415C]" />
            <span className="text-stone-500 font-medium hidden sm:inline">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Batches</option>
              {availableBatches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.batchName}
                </option>
              ))}
            </select>
          </div>

          {/* Period / Month Selector */}
          <div className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center gap-2 flex-1 sm:flex-initial">
            <Calendar className="w-3.5 h-3.5 text-[#08415C]" />
            <span className="text-stone-500 font-medium hidden sm:inline">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer text-xs"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle: Overview (Compact View) vs Detailed Report */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("compact")}
            className={`px-3 py-1.5 rounded-lg transition text-center ${
              viewMode === "compact"
                ? "bg-[#08415C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Overview (Compact)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("detailed")}
            className={`px-3 py-1.5 rounded-lg transition text-center ${
              viewMode === "detailed"
                ? "bg-[#08415C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Detailed Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#78909C]">
          <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-2">🪷</div>
          <p className="text-xs font-semibold text-[#08415C]">Generating Analytics &amp; Reports...</p>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* 1. COMPACT VIEW (OVERVIEW): 4 KPIs + Attendance Health Donut */}
          {/* ============================================================== */}
          {viewMode === "compact" && (
            <div className="space-y-4 sm:space-y-6">
              {/* 4 Summary KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {/* KPI 1: Total Members */}
                <div className="gold-card p-3.5 sm:p-4 border-t-3 border-t-[#08415C]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#78909C] uppercase tracking-wider">
                      Total Members
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#08415C]/10 text-[#08415C] flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
                      {summary.totalMembers}
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#00A896] font-semibold">
                      Registered in course batches
                    </div>
                  </div>
                </div>

                {/* KPI 2: Total Calls */}
                <div className="gold-card p-3.5 sm:p-4 border-t-3 border-t-[#D4AF37]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#78909C] uppercase tracking-wider">
                      Total Calls
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
                      {summary.totalCalls}
                    </div>
                    <div className="text-[10px] sm:text-xs text-stone-500">
                      Calls logged by volunteers
                    </div>
                  </div>
                </div>

                {/* KPI 3: Interested (RSVP Yes) */}
                <div className="gold-card p-3.5 sm:p-4 border-t-3 border-t-[#00A896]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#78909C] uppercase tracking-wider">
                      Interested
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800">
                      {summary.interestedCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-emerald-700 font-semibold">
                      {summary.interestedPercent}% positive RSVP
                    </div>
                  </div>
                </div>

                {/* KPI 4: Active Registered Students */}
                <div className="gold-card p-3.5 sm:p-4 border-t-3 border-t-purple-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#78909C] uppercase tracking-wider">
                      Registered
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900">
                      {summary.registeredCount}
                    </div>
                    <div className="text-[10px] sm:text-xs text-purple-700 font-semibold">
                      Active batch attendees
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Overview Card (Donut / Progress Breakdown) */}
              <div className="gold-card p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5D8B8]/70 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Attendance Overview &amp; Regularity Funnel
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Health breakdown of enrolled devotees based on regular presence
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("detailed");
                      setDetailedTab("attendance");
                    }}
                    className="text-xs font-bold text-[#08415C] hover:text-[#063349] flex items-center gap-1 group"
                  >
                    <span>View Day-wise Attendance Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Left: Overall Health Stat */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center space-y-1">
                    <div className="text-3xl sm:text-4xl font-serif font-bold text-emerald-800">
                      {summary.attendanceHealthPercent}%
                    </div>
                    <div className="text-xs font-bold text-emerald-700">Average Regularity Health</div>
                    <p className="text-[10px] text-emerald-600">
                      Devotees attending sessions consistently
                    </p>
                  </div>

                  {/* Middle: 3-Color Horizontal Progress Stack */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        style={{
                          width: `${Math.round((summary.regularCount / Math.max(1, summary.totalMembers)) * 100)}%`,
                        }}
                        className="bg-emerald-500 h-full"
                        title={`Regular: ${summary.regularCount}`}
                      />
                      <div
                        style={{
                          width: `${Math.round((summary.irregularCount / Math.max(1, summary.totalMembers)) * 100)}%`,
                        }}
                        className="bg-amber-400 h-full"
                        title={`Irregular: ${summary.irregularCount}`}
                      />
                      <div
                        style={{
                          width: `${Math.round((summary.criticalCount / Math.max(1, summary.totalMembers)) * 100)}%`,
                        }}
                        className="bg-rose-500 h-full"
                        title={`Critical: ${summary.criticalCount}`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-white border border-emerald-200 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Regular (≥75%)</span>
                        </div>
                        <div className="text-base font-bold text-emerald-700 mt-0.5">{summary.regularCount} Devotees</div>
                      </div>

                      <div className="p-2.5 bg-white border border-amber-200 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Irregular (50-74%)</span>
                        </div>
                        <div className="text-base font-bold text-amber-700 mt-0.5">{summary.irregularCount} Devotees</div>
                      </div>

                      <div className="p-2.5 bg-white border border-rose-200 rounded-xl">
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Critical (&lt;50%)</span>
                        </div>
                        <div className="text-base font-bold text-rose-700 mt-0.5">{summary.criticalCount} Devotees</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Responses Snapshot */}
              <div className="gold-card p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5D8B8]/70 pb-2.5">
                  <h3 className="font-serif font-bold text-base text-[#08415C] flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                    Call Responses Summary
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("detailed");
                      setDetailedTab("response");
                    }}
                    className="text-xs font-bold text-[#08415C] hover:underline"
                  >
                    View All Outcomes ➔
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(reportData.responseBreakdown || []).map((resp: any) => (
                    <div
                      key={resp.outcome}
                      className={`p-2.5 rounded-xl border text-center ${resp.badgeBg}`}
                    >
                      <div className="text-xs">{resp.icon}</div>
                      <div className="text-base sm:text-lg font-serif font-bold mt-0.5">
                        {resp.count}
                      </div>
                      <div className="text-[10px] font-bold truncate">{resp.label}</div>
                      <div className="text-[9px] opacity-80">{resp.percent}% of calls</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. DETAILED VIEW: 3 Sub-tabs (Attendance, Calling, Responses) */}
          {/* ============================================================== */}
          {viewMode === "detailed" && (
            <div className="space-y-4">
              {/* Sub-tabs Header Bar */}
              <div className="flex items-center border-b border-[#E5D8B8] pb-1 gap-2 text-xs font-bold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDetailedTab("attendance")}
                  className={`py-2 px-4 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                    detailedTab === "attendance"
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>1. Attendance Day-by-Day (Kitne log aaye)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailedTab("calling")}
                  className={`py-2 px-4 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                    detailedTab === "calling"
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>2. Calling Desk (Kitne calls hue)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailedTab("response")}
                  className={`py-2 px-4 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                    detailedTab === "response"
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>3. Response Breakdown (Devotee Responses)</span>
                </button>
              </div>

              {/* -------------------------------------------------------- */}
              {/* SUB-TAB 1: ATTENDANCE ("kitne log aaye konse din") */}
              {/* -------------------------------------------------------- */}
              {detailedTab === "attendance" && (
                <div className="space-y-4">
                  {/* Visual Attendance Bar Chart Representation */}
                  <div className="gold-card p-4 sm:p-5 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#08415C] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                      Session Attendance Trajectory
                    </h4>

                    {reportData.attendanceByDate && reportData.attendanceByDate.length > 0 ? (
                      <div className="flex items-end gap-2 sm:gap-4 h-36 pt-4 px-2 overflow-x-auto pb-2 border-b border-stone-100">
                        {reportData.attendanceByDate.map((item: any) => (
                          <div
                            key={item.sessionId}
                            className="flex flex-col items-center gap-1 min-w-[50px] flex-1 group"
                          >
                            <span className="text-[10px] font-bold text-[#08415C]">
                              {item.presentCount}
                            </span>
                            <div className="w-full max-w-[28px] bg-stone-100 rounded-t-lg h-24 flex items-end overflow-hidden">
                              <div
                                style={{ height: `${Math.min(100, item.attendancePercent)}%` }}
                                className={`w-full transition-all duration-500 rounded-t-lg ${
                                  item.attendancePercent >= 75
                                    ? "bg-emerald-500 group-hover:bg-emerald-600"
                                    : item.attendancePercent >= 50
                                    ? "bg-amber-400 group-hover:bg-amber-500"
                                    : "bg-rose-400 group-hover:bg-rose-500"
                                }`}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-stone-600 truncate max-w-[50px]">
                              S{item.sessionNumber}
                            </span>
                            <span className="text-[8px] text-stone-400 whitespace-nowrap">
                              {item.dateFormatted}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-stone-500">
                        No session attendances recorded yet for this batch.
                      </div>
                    )}
                  </div>

                  {/* Attendance Table */}
                  <div className="gold-card overflow-hidden shadow-xs">
                    <div className="p-3.5 sm:p-4 border-b border-[#E5D8B8] flex items-center justify-between bg-[#FAF8F5]">
                      <div className="font-serif font-bold text-sm text-[#08415C]">
                        Date-wise Attendance Log Table
                      </div>
                      <span className="text-xs text-stone-500">
                        Showing {reportData.attendanceByDate?.length || 0} sessions
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5]/80 text-[#08415C] font-bold border-b border-[#E5D8B8]/60">
                          <tr>
                            <th className="py-2.5 px-3.5">Date</th>
                            <th className="py-2.5 px-3">Session</th>
                            <th className="py-2.5 px-3">Batch</th>
                            <th className="py-2.5 px-3 text-center text-emerald-800">Present (આવ્યા)</th>
                            <th className="py-2.5 px-3 text-center text-rose-800">Absent (ગેરહાજર)</th>
                            <th className="py-2.5 px-3 text-center">Total Expected</th>
                            <th className="py-2.5 px-3 text-center">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5D8B8]/40">
                          {reportData.attendanceByDate && reportData.attendanceByDate.length > 0 ? (
                            reportData.attendanceByDate.map((row: any) => (
                              <tr key={row.sessionId} className="hover:bg-[#FAF8F5] transition">
                                <td className="py-3 px-3.5 font-bold text-stone-800 whitespace-nowrap">
                                  {row.dateFormatted}
                                </td>
                                <td className="py-3 px-3 font-semibold text-[#08415C]">
                                  S{row.sessionNumber}: {row.title}
                                </td>
                                <td className="py-3 px-3 text-stone-600 font-medium">
                                  {row.batchName}
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                                  {row.presentCount}
                                </td>
                                <td className="py-3 px-3 text-center font-bold text-rose-700 bg-rose-50/40">
                                  {row.absentCount}
                                </td>
                                <td className="py-3 px-3 text-center text-stone-700 font-mono">
                                  {row.total}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                      row.attendancePercent >= 75
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                        : row.attendancePercent >= 50
                                        ? "bg-amber-50 text-amber-800 border-amber-300"
                                        : "bg-rose-50 text-rose-800 border-rose-300"
                                    }`}
                                  >
                                    {row.attendancePercent}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-stone-500">
                                No sessions found for this course/batch.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SUB-TAB 2: CALLING ("kitne calls hue") */}
              {/* -------------------------------------------------------- */}
              {detailedTab === "calling" && (
                <div className="space-y-4">
                  {/* Caller Performance Table */}
                  <div className="gold-card overflow-hidden shadow-xs">
                    <div className="p-3.5 sm:p-4 border-b border-[#E5D8B8] flex items-center justify-between bg-[#FAF8F5]">
                      <div className="font-serif font-bold text-sm text-[#08415C]">
                        Volunteer Caller Performance &amp; Calling Volume
                      </div>
                      <span className="text-xs text-stone-500">
                        {reportData.callingByVolunteer?.length || 0} Callers Active
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5]/80 text-[#08415C] font-bold border-b border-[#E5D8B8]/60">
                          <tr>
                            <th className="py-2.5 px-3.5">Volunteer / Caller</th>
                            <th className="py-2.5 px-3 text-center">Total Calls Done</th>
                            <th className="py-2.5 px-3 text-center text-emerald-800">Connected</th>
                            <th className="py-2.5 px-3 text-center text-[#B8860B]">RSVP Yes (Interested)</th>
                            <th className="py-2.5 px-3 text-center">Connection Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5D8B8]/40">
                          {reportData.callingByVolunteer && reportData.callingByVolunteer.length > 0 ? (
                            reportData.callingByVolunteer.map((c: any) => {
                              const connectRate = c.totalCalls > 0 ? Math.round((c.connectedCalls / c.totalCalls) * 100) : 0;
                              return (
                                <tr key={c.id} className="hover:bg-[#FAF8F5] transition">
                                  <td className="py-3 px-3.5 font-bold text-stone-900 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-[#08415C] text-[#D4AF37] font-bold text-[10px] flex items-center justify-center">
                                      {c.name.slice(0, 1)}
                                    </div>
                                    <span>{c.name}</span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-[#08415C] text-sm">
                                    {c.totalCalls}
                                  </td>
                                  <td className="py-3 px-3 text-center font-semibold text-emerald-700">
                                    {c.connectedCalls}
                                  </td>
                                  <td className="py-3 px-3 text-center font-bold text-amber-700">
                                    {c.yesCount}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                                      {connectRate}% Connected
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-stone-500">
                                No calls logged yet for this period.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Call Activity Feed */}
                  <div className="gold-card p-4 sm:p-5 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-[#08415C] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      Recent Call Logs Feed
                    </h4>

                    <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
                      {(reportData.recentCallLogs || []).map((log: any) => (
                        <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800">{log.person?.fullName || "Member"}</span>
                              <span className="font-mono text-[10px] text-stone-500">+91 {log.person?.mobile}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-stone-100 text-stone-700">
                                {log.outcome}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-[11px] text-stone-600 italic">&quot;{log.notes}&quot;</p>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0 text-[10px] text-stone-400">
                            <div>Caller: {log.volunteer?.name || "Caller"}</div>
                            <div>{new Date(log.createdAt).toLocaleDateString("en-IN")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* SUB-TAB 3: RESPONSE BREAKDOWN ("kitne logo ka kya response aaya") */}
              {/* -------------------------------------------------------- */}
              {detailedTab === "response" && (
                <div className="space-y-4">
                  <div className="gold-card p-4 sm:p-6 space-y-4">
                    <h4 className="font-serif font-bold text-base text-[#08415C] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      Devotee Call Responses &amp; Sentiment Distribution
                    </h4>
                    <p className="text-xs text-stone-500">
                      Detailed breakdown of every outcome recorded during outreach calls
                    </p>

                    <div className="space-y-3 pt-2">
                      {(reportData.responseBreakdown || []).map((resp: any) => (
                        <div
                          key={resp.outcome}
                          className="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-[#08415C] transition shadow-xs"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-bold text-stone-800">
                              <span className="text-base">{resp.icon}</span>
                              <span className="text-sm">{resp.label}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-base font-serif font-bold text-[#08415C]">
                                {resp.count} Devotees
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${resp.badgeBg}`}>
                                {resp.percent}%
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${resp.percent}%` }}
                              className={`h-full ${resp.color} rounded-full transition-all duration-500`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
