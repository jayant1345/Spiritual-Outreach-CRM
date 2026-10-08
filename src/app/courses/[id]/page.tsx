"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import * as XLSX from "xlsx";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  PhoneCall,
  MessageSquare,
  Download,
  Plus,
  ArrowLeft,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  CalendarPlus,
  Layers,
  Zap,
  Search,
  TableProperties,
  Check,
} from "lucide-react";

function CourseAttendanceMatrixInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.id as string;
  const urlBatchId = searchParams?.get("batchId") || "";
  const urlMode = (searchParams?.get("mode") as "checkin" | "matrix") || "checkin";

  const { openPersonModal, openCallModal, openWhatsAppModal } = useContext(CRMContext);

  const [course, setCourse] = useState<any>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(urlBatchId);
  const [activeMode, setActiveMode] = useState<"checkin" | "matrix">(urlMode);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [checkinFilter, setCheckinFilter] = useState<"ALL" | "PENDING_RSVP" | "PRESENT" | "UNMARKED">("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedRegularity, setSelectedRegularity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      setCourse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  useEffect(() => {
    if (urlBatchId) {
      setSelectedBatchId(urlBatchId);
    } else if (course?.batches?.length > 0 && !selectedBatchId) {
      setSelectedBatchId(course.batches[0].id);
    }
  }, [urlBatchId, course, selectedBatchId]);

  const batch =
    (course?.batches && course.batches.find((b: any) => b.id === selectedBatchId)) ||
    course?.batches?.[0] || { sessions: [], enrollments: [], batchName: "Main Batch" };
  const sessions = batch?.sessions || [];
  const enrollments = batch?.enrollments || [];

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const uncompleted = sessions.find((s: any) => !s.completed);
      setSelectedSessionId(uncompleted ? uncompleted.id : sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  const handleToggleAttendance = async (
    sessionId: string,
    enrollmentId: string,
    personId: string,
    currentStatus: string
  ) => {
    const nextStatus = currentStatus === "PRESENT" ? "ABSENT" : "PRESENT";
    setMarkingSessionId(`${sessionId}-${personId}`);

    try {
      await fetch("/api/courses/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          enrollmentId,
          personId,
          status: nextStatus,
        }),
      });
      fetchCourseDetails();
    } catch (err) {
      console.error("Error toggling attendance:", err);
    } finally {
      setMarkingSessionId(null);
    }
  };

  const handleCreateAbsenteeFollowup = async (personId: string, name: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          dueDate: tomorrow.toISOString(),
          type: "Course Follow-up",
          remarks: `Absent student follow-up for ${course?.title || "Course Session"}. Inquire about missed session & share recording/notes.`,
        }),
      });

      alert(`Follow-up task created in Calling Sewa queue for ${name}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = () => {
    if (!course || !batch) return;
    const sList = sessions || [];

    const rows = (enrollments || []).map((enr: any, idx: number) => {
      const rowData: any = {
        "Sr No": idx + 1,
        "Student Name": enr.person?.fullName || "Unnamed",
        "Mobile Number": enr.person?.mobile || "",
        "Locality": enr.person?.area || "Chandkheda",
        "Assigned Volunteer": enr.person?.assignedVolunteer?.name || "Unassigned",
      };

      sList.forEach((sess: any) => {
        const att = enr.attendances?.find((a: any) => a.sessionId === sess.id);
        rowData[`Session ${sess.sessionNumber}`] = att ? att.status : "—";
      });

      rowData["Attendance %"] = `${enr.attendancePercent || 0}%`;
      rowData["Regularity Status"] = enr.status || "UNKNOWN";

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Grid");
    XLSX.writeFile(wb, `${course?.title || "Course"}_Attendance_Matrix.xlsx`);
  };

  if (loading || !course) {
    return (
      <div className="py-24 text-center text-[#78909C]">
        <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-3">🪷</div>
        <p className="text-sm font-semibold">Loading Course Attendance Matrix...</p>
      </div>
    );
  }

  const filteredEnrollments = enrollments.filter((enr: any) => {
    const fullName = enr.person?.fullName || "";
    const mobile = enr.person?.mobile || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mobile.includes(searchQuery);
    const matchesReg =
      selectedRegularity === "ALL" || enr.status === selectedRegularity;
    return matchesSearch && matchesReg;
  });

  const regularCount = enrollments.filter((e: any) => e.status === "REGULAR").length;
  const irregularCount = enrollments.filter((e: any) => e.status === "IRREGULAR").length;
  const lowCount = enrollments.filter((e: any) => e.status === "LOW_ATTENDANCE").length;

  // Active session for Fast Check-In
  const currentSession =
    sessions.find((s: any) => s.id === selectedSessionId) ||
    sessions.find((s: any) => !s.completed) ||
    sessions[0];

  // Compute RSVP and Attendance metrics for the active session
  let confirmedRsvpCount = 0;
  let presentInSessionCount = 0;
  let pendingRsvpCount = 0;

  enrollments.forEach((enr: any) => {
    const hasConfirmedCall = enr.person?.callLogs?.some(
      (c: any) => c.outcome === "YES_WILL_ATTEND"
    );
    const isPresent = enr.attendances?.some(
      (a: any) => a.sessionId === currentSession?.id && a.status === "PRESENT"
    );

    if (hasConfirmedCall) confirmedRsvpCount++;
    if (isPresent) presentInSessionCount++;
    if (hasConfirmedCall && !isPresent) pendingRsvpCount++;
  });

  const checkinEnrollments = enrollments.filter((enr: any) => {
    const q = searchQuery.toLowerCase().trim();
    const fullName = enr.person?.fullName || "";
    const mobile = enr.person?.mobile || "";
    const area = enr.person?.area || "";
    const matchesSearch =
      !q ||
      fullName.toLowerCase().includes(q) ||
      mobile.includes(q) ||
      area.toLowerCase().includes(q);

    const hasConfirmedCall = enr.person?.callLogs?.some(
      (c: any) => c.outcome === "YES_WILL_ATTEND"
    );
    const isPresent = enr.attendances?.some(
      (a: any) => a.sessionId === currentSession?.id && a.status === "PRESENT"
    );

    if (!matchesSearch) return false;

    if (checkinFilter === "PENDING_RSVP") {
      return hasConfirmedCall && !isPresent;
    }
    if (checkinFilter === "PRESENT") {
      return isPresent;
    }
    if (checkinFilter === "UNMARKED") {
      return !isPresent;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-[#78909C]">
        <Link href="/courses" className="hover:text-[#08415C] flex items-center gap-1 font-semibold flex-shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
        <span>/</span>
        <span className="truncate max-w-[140px] sm:max-w-none">{course.title}</span>
        <span>/</span>
        <span className="text-[#08415C] font-semibold truncate max-w-[120px] sm:max-w-none">{batch.batchName}</span>
      </div>

      {/* Batch Tabs if multiple batches exist for this course */}
      {course.batches && course.batches.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-stone-500 whitespace-nowrap flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Batches:
          </span>
          {course.batches.map((b: any) => (
            <button
              key={b.id}
              onClick={() => setSelectedBatchId(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                b.id === batch.id
                  ? "bg-[#08415C] text-white shadow-xs"
                  : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span>{b.batchName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  b.id === batch.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                {b.enrollments?.length || 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Top Course Header Banner */}
      <div className="gold-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#08415C] break-words">
                {course.title}
              </h2>
              <Badge variant="emerald">
                {sessions.filter((s: any) => s.completed).length} of {course.totalSessions} Sessions Done
              </Badge>
            </div>
            <p className="text-xs text-[#78909C] mt-1 break-words">
              Faculty: <strong>{course.facultyName || "HG Radheshyam Das"}</strong> • Batch: <strong>{batch.batchName}</strong> • Schedule: {batch.scheduleInfo} • Venue: {course.venue}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <Link
              href={`/calling-sewa?batch=${encodeURIComponent(batch.batchName)}`}
              className="px-3.5 py-2 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-xs font-bold text-amber-900 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition w-full sm:w-auto"
              title={`Open Calling Desk for ${batch.batchName}`}
            >
              <PhoneCall className="w-4 h-4 text-amber-700" />
              <span>📞 Calling Desk</span>
            </Link>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white border border-[#E5D8B8] hover:border-[#D4AF37] text-xs font-semibold text-[#08415C] rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00A896]" />
              <span>Export Matrix (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Regularity KPI Breakdown - 2x2 grid on mobile, 4 columns on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-[#E5D8B8]/60">
          <div className="p-2.5 sm:p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-center">
            <div className="text-[11px] sm:text-xs text-[#78909C]">Total Registered</div>
            <div className="text-lg sm:text-xl font-bold font-serif text-[#08415C] mt-0.5">{enrollments.length} Students</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
            <div className="text-[11px] sm:text-xs text-emerald-800">Regular (≥75%)</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">{regularCount} Students</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-300 rounded-xl text-center">
            <div className="text-[11px] sm:text-xs text-amber-800">Irregular (50-74%)</div>
            <div className="text-lg sm:text-xl font-bold text-amber-700 mt-0.5">{irregularCount} Need Calling</div>
          </div>
          <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <div className="text-[11px] sm:text-xs text-red-800">Low Attendance (&lt;50%)</div>
            <div className="text-lg sm:text-xl font-bold text-red-700 mt-0.5">{lowCount} Urgent Care</div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 border border-[#E5D8B8] rounded-2xl shadow-xs">
        <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveMode("checkin")}
            className={`px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === "checkin"
                ? "bg-[#08415C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>⚡ Fatafat Fast Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("matrix")}
            className={`px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeMode === "matrix"
                ? "bg-[#08415C] text-white shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <TableProperties className="w-3.5 h-3.5 text-[#00A896]" />
            <span>📊 Full Matrix Grid</span>
          </button>
        </div>

        {sessions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-stone-500 whitespace-nowrap">Session:</span>
            {sessions.map((sess: any) => {
              const isCurrent = sess.id === currentSession?.id;
              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => setSelectedSessionId(sess.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "bg-[#FAF8F5] border border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <span>S{sess.sessionNumber}</span>
                  <span className="text-[10px] font-normal opacity-75">
                    ({new Date(sess.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* MODE 1: FATAFAT FAST CHECK-IN (DOOR / RECEPTION KIOSK) */}
      {activeMode === "checkin" && (
        <div className="space-y-4">
          {/* Calling RSVP vs. Arrived Tracker Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-center">
              <div className="text-[11px] text-blue-800 font-bold">📞 Calling Confirmed (Said YES)</div>
              <div className="text-2xl font-bold font-serif text-blue-900 mt-0.5">{confirmedRsvpCount} Devotees</div>
              <div className="text-[10px] text-blue-700 mt-0.5">Promised during outreach calling</div>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-2xl text-center">
              <div className="text-[11px] text-emerald-800 font-bold">🟢 Arrived &amp; Present</div>
              <div className="text-2xl font-bold font-serif text-emerald-700 mt-0.5">{presentInSessionCount} Checked In</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                {confirmedRsvpCount > 0 ? `${Math.round((presentInSessionCount / confirmedRsvpCount) * 100)}% of confirmed RSVPs` : "Marked present"}
              </div>
            </div>

            <div
              onClick={() => setCheckinFilter(checkinFilter === "PENDING_RSVP" ? "ALL" : "PENDING_RSVP")}
              className={`p-3 rounded-2xl text-center cursor-pointer transition border ${
                checkinFilter === "PENDING_RSVP"
                  ? "bg-amber-100 border-amber-400 ring-2 ring-amber-500 shadow-xs"
                  : "bg-amber-50/80 border-amber-300 hover:bg-amber-100/70"
              }`}
              title="Tap to show only pending devotees who said YES to follow up"
            >
              <div className="text-[11px] text-amber-900 font-bold flex items-center justify-center gap-1">
                <span>🟡 Pending (Said YES, Not Arrived)</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full font-bold">Call Now</span>
              </div>
              <div className="text-2xl font-bold font-serif text-amber-800 mt-0.5">{pendingRsvpCount} Devotees</div>
              <div className="text-[10px] text-amber-800 font-semibold mt-0.5">Tap here to call &amp; follow up ➔</div>
            </div>
          </div>

          {/* Quick Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name or phone to fast check-in..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setCheckinFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  checkinFilter === "ALL"
                    ? "bg-[#08415C] text-white shadow-xs"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                All ({enrollments.length})
              </button>
              <button
                type="button"
                onClick={() => setCheckinFilter("PENDING_RSVP")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  checkinFilter === "PENDING_RSVP"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100"
                }`}
              >
                📞 Pending RSVPs ({pendingRsvpCount})
              </button>
              <button
                type="button"
                onClick={() => setCheckinFilter("PRESENT")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  checkinFilter === "PRESENT"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                🟢 Present ({presentInSessionCount})
              </button>
              <button
                type="button"
                onClick={() => setCheckinFilter("UNMARKED")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  checkinFilter === "UNMARKED"
                    ? "bg-stone-700 text-white shadow-xs"
                    : "bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200"
                }`}
              >
                ⚪ Unmarked ({enrollments.length - presentInSessionCount})
              </button>
            </div>
          </div>

          {/* Devotees Fast Check-In Cards List */}
          <div className="space-y-2.5">
            {checkinEnrollments.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-200 rounded-2xl">
                No devotees match the selected check-in criteria.
              </div>
            ) : (
              checkinEnrollments.map((enr: any) => {
                const isPresent = enr.attendances?.some(
                  (a: any) => a.sessionId === currentSession?.id && a.status === "PRESENT"
                );
                const hasConfirmedCall = enr.person?.callLogs?.some(
                  (c: any) => c.outcome === "YES_WILL_ATTEND"
                );
                const isMarking = markingSessionId === `${currentSession?.id}-${enr.person.id}`;

                return (
                  <div
                    key={enr.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                      isPresent
                        ? "bg-emerald-50/70 border-emerald-300"
                        : hasConfirmedCall
                        ? "bg-amber-50/50 border-amber-300"
                        : "bg-white border-[#E5D8B8]"
                    }`}
                  >
                    {/* Left Info */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => openPersonModal(enr.person.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-base text-[#08415C]">
                          {enr.person.fullName}
                        </span>
                        <span className="text-xs font-mono font-semibold text-stone-600">
                          +91 {enr.person.mobile}
                        </span>
                        {enr.person.area && (
                          <span className="text-[11px] text-stone-500">• {enr.person.area}</span>
                        )}
                        {hasConfirmedCall && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                            📞 Promised on Call (Said YES)
                          </span>
                        )}
                        {isPresent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✅ Present &amp; Checked In
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Caller: <strong>{enr.person.assignedVolunteer?.name || "Unassigned"}</strong> • Regularity: {enr.attendancePercent}% ({enr.status})
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      {/* If Pending RSVP, offer quick call and whatsapp */}
                      {hasConfirmedCall && !isPresent && (
                        <>
                          <a
                            href={`tel:${enr.person.mobile}`}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-[#08415C] rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                            title="Call Devotee directly on Phone"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-[#00A896]" />
                            <span>Call Now</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => openWhatsAppModal(enr.person)}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-[#25D366] rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}

                      {/* 1-Tap Check-In Button */}
                      <button
                        type="button"
                        disabled={isMarking}
                        onClick={() =>
                          handleToggleAttendance(
                            currentSession?.id,
                            enr.id,
                            enr.person.id,
                            isPresent ? "PRESENT" : "ABSENT"
                          )
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                          isPresent
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-[#08415C] hover:bg-[#063349] text-white shadow-gold"
                        }`}
                      >
                        {isMarking ? (
                          <span>Updating...</span>
                        ) : isPresent ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            <span>Checked In (Undo)</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-[#D4AF37]" />
                            <span>⚡ 1-Tap Check In</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODE 2: FULL SESSION ATTENDANCE MATRIX TABLE */}
      {activeMode === "matrix" && (
        <div className="space-y-4">
          {/* Interactive Controls & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student name or phone..."
                className="px-3.5 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C] w-full sm:w-64"
              />

              <select
                value={selectedRegularity}
                onChange={(e) => setSelectedRegularity(e.target.value)}
                className="px-3.5 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C] w-full sm:w-auto"
              >
                <option value="ALL">All Standing</option>
                <option value="REGULAR">Regular Students</option>
                <option value="IRREGULAR">Irregular (Needs Follow-up)</option>
                <option value="LOW_ATTENDANCE">Low Attendance</option>
              </select>
            </div>

            <span className="text-xs text-[#78909C]">
              Showing <strong>{filteredEnrollments.length}</strong> of {enrollments.length} Students • <span className="hidden sm:inline">Click any session cell to toggle status</span><span className="sm:hidden">Tap cell to toggle</span>
            </span>
          </div>

          {/* Interactive Session Attendance Matrix Table */}
          <div className="gold-card overflow-hidden">
            {/* Mobile Swipe Hint */}
            <div className="sm:hidden px-3.5 py-2 bg-[#FAF8F5] border-b border-[#E5D8B8]/80 text-[11px] text-[#78909C] flex items-center justify-between font-medium">
              <span>👈 Swipe horizontally to view sessions &amp; actions 👉</span>
              <span>{sessions.length} Sessions</span>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead className="bg-[#FAF8F5] border-b border-[#E5D8B8] text-[#78909C] uppercase font-semibold">
                  <tr>
                    <th className="p-3.5 w-8 text-center">#</th>
                    <th className="p-3.5 min-w-[180px]">Student Name &amp; Locality</th>
                    <th className="p-3.5 min-w-[120px]">Assigned Sewak</th>
                    {sessions.map((sess: any) => (
                      <th key={sess.id} className="p-3 text-center min-w-[90px]">
                        <div>S{sess.sessionNumber}</div>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {new Date(sess.sessionDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-center">Attended</th>
                    <th className="p-3 text-center">Rate</th>
                    <th className="p-3 text-center">Regularity</th>
                    <th className="p-3 text-right min-w-[120px]">Follow-up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D8B8]/60 bg-white">
                  {filteredEnrollments.map((enr: any, idx: number) => {
                    const attendedCount = enr.attendances?.filter(
                      (a: any) => a.status === "PRESENT"
                    ).length || 0;

                    return (
                      <tr key={enr.id} className="hover:bg-[#FAF8F5] transition">
                        <td className="p-3.5 text-center text-[#78909C] font-mono">
                          {idx + 1}
                        </td>

                        {/* Student Name */}
                        <td className="p-3.5">
                          <div
                            className="cursor-pointer group"
                            onClick={() => openPersonModal(enr.person.id)}
                          >
                            <div className="font-serif font-bold text-sm text-[#08415C] group-hover:text-[#0B4F6C]">
                              {enr.person.fullName}
                            </div>
                            <div className="text-[11px] text-[#78909C]">
                              +91 {enr.person.mobile} • {enr.person.area || "Chandkheda"}
                            </div>
                          </div>
                        </td>

                        {/* Assigned Sewak */}
                        <td className="p-3.5 text-xs text-[#37474F]">
                          {enr.person.assignedVolunteer?.name || "Unassigned"}
                        </td>

                        {/* Session Columns */}
                        {sessions.map((sess: any) => {
                          const att = enr.attendances?.find(
                            (a: any) => a.sessionId === sess.id
                          );
                          const status = att ? att.status : "NONE";
                          const isMarking = markingSessionId === `${sess.id}-${enr.person.id}`;

                          return (
                            <td key={sess.id} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={isMarking}
                                onClick={() =>
                                  handleToggleAttendance(
                                    sess.id,
                                    enr.id,
                                    enr.person.id,
                                    status
                                  )
                                }
                                className={`w-10 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center mx-auto border ${
                                  status === "PRESENT"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-400 hover:bg-emerald-100"
                                    : status === "ABSENT"
                                    ? "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                    : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400"
                                }`}
                                title={`Click to toggle attendance for Session ${sess.sessionNumber}`}
                              >
                                {isMarking ? (
                                  "..."
                                ) : status === "PRESENT" ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : status === "ABSENT" ? (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  "—"
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* Total Attended */}
                        <td className="p-3 text-center font-bold text-[#08415C]">
                          {attendedCount} / {sessions.length}
                        </td>

                        {/* Attendance % */}
                        <td className="p-3 text-center">
                          <span className="font-bold text-xs text-[#08415C]">
                            {enr.attendancePercent}%
                          </span>
                        </td>

                        {/* Regularity Standing Badge */}
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              enr.status === "REGULAR"
                                ? "emerald"
                                : enr.status === "IRREGULAR"
                                ? "amber"
                                : "red"
                            }
                          >
                            {enr.status}
                          </Badge>
                        </td>

                        {/* Quick Follow-up Action */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCreateAbsenteeFollowup(enr.person.id, enr.person.fullName)}
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                              title="Create Absent/Irregular Follow-up Task"
                            >
                              <CalendarPlus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openCallModal(enr.person)}
                              className="p-1.5 bg-[#00A896] hover:bg-[#028090] text-white rounded-lg transition"
                              title="Call Student"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openWhatsAppModal(enr.person)}
                              className="p-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white rounded-lg border border-[#D4AF37]/50 transition"
                              title="Send Catch-up WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-[#D4AF37]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseAttendanceMatrixPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center text-[#78909C]">
          <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-3">🪷</div>
          <p className="text-sm font-semibold">Loading Course Attendance Matrix...</p>
        </div>
      }
    >
      <CourseAttendanceMatrixInner />
    </React.Suspense>
  );
}
