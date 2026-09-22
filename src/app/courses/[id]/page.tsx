"use client";

import React, { useState, useEffect, useContext } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";

export default function CourseAttendanceMatrixPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const { openPersonModal, openCallModal, openWhatsAppModal } = useContext(CRMContext);

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegularity, setSelectedRegularity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [markingSessionId, setMarkingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

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

  const handleExportExcel = () => {
    if (!course || !course.batches?.[0]) return;
    const batch = course.batches[0];
    const sessions = batch.sessions || [];

    const rows = batch.enrollments.map((enr: any, idx: number) => {
      const rowData: any = {
        "Sr No": idx + 1,
        "Student Name": enr.person.fullName,
        "Mobile Number": enr.person.mobile,
        "Locality": enr.person.area || "Chandkheda",
        "Assigned Volunteer": enr.person.assignedVolunteer?.name || "Unassigned",
      };

      sessions.forEach((sess: any) => {
        const att = enr.attendances.find((a: any) => a.sessionId === sess.id);
        rowData[`Session ${sess.sessionNumber}`] = att ? att.status : "—";
      });

      rowData["Attendance %"] = `${enr.attendancePercent}%`;
      rowData["Regularity Status"] = enr.status;

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Grid");
    XLSX.writeFile(wb, `${course.title}_Attendance_Matrix.xlsx`);
  };

  if (loading || !course) {
    return (
      <div className="py-24 text-center text-[#78909C]">
        <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-3">🪷</div>
        <p className="text-sm font-semibold">Loading Course Attendance Matrix...</p>
      </div>
    );
  }

  const batch = course.batches?.[0] || { sessions: [], enrollments: [] };
  const sessions = batch.sessions || [];
  const enrollments = batch.enrollments || [];

  const filteredEnrollments = enrollments.filter((enr: any) => {
    const matchesSearch =
      enr.person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.person.mobile.includes(searchQuery);
    const matchesReg =
      selectedRegularity === "ALL" || enr.status === selectedRegularity;
    return matchesSearch && matchesReg;
  });

  const regularCount = enrollments.filter((e: any) => e.status === "REGULAR").length;
  const irregularCount = enrollments.filter((e: any) => e.status === "IRREGULAR").length;
  const lowCount = enrollments.filter((e: any) => e.status === "LOW_ATTENDANCE").length;

  return (
    <div className="space-y-6">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#78909C]">
        <Link href="/courses" className="hover:text-[#08415C] flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
        <span>/</span>
        <span>{course.title}</span>
        <span>/</span>
        <span className="text-[#08415C] font-semibold">{batch.batchName}</span>
      </div>

      {/* Top Course Header Banner */}
      <div className="gold-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-2xl text-[#08415C]">
                {course.title}
              </h2>
              <Badge variant="emerald">
                {sessions.filter((s: any) => s.completed).length} of {course.totalSessions} Sessions Done
              </Badge>
            </div>
            <p className="text-xs text-[#78909C] mt-1">
              Faculty: <strong>{course.facultyName || "HG Radheshyam Das"}</strong> • Schedule: {batch.scheduleInfo} • Venue: {course.venue}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-white border border-[#E5D8B8] hover:border-[#D4AF37] text-xs font-semibold text-[#08415C] rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#00A896]" />
              <span>Export Matrix (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Regularity KPI Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E5D8B8]/60">
          <div className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-center">
            <div className="text-xs text-[#78909C]">Total Registered</div>
            <div className="text-xl font-bold font-serif text-[#08415C] mt-0.5">{enrollments.length} Students</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
            <div className="text-xs text-emerald-800">Regular (≥75% Attendance)</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{regularCount} Students</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-center">
            <div className="text-xs text-amber-800">Irregular (50-74%)</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{irregularCount} (Needs Calling)</div>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <div className="text-xs text-red-800">Low Attendance (&lt;50%)</div>
            <div className="text-xl font-bold text-red-700 mt-0.5">{lowCount} (Urgent Care)</div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            className="px-3.5 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
          >
            <option value="ALL">All Standing</option>
            <option value="REGULAR">Regular Students</option>
            <option value="IRREGULAR">Irregular (Needs Follow-up)</option>
            <option value="LOW_ATTENDANCE">Low Attendance</option>
          </select>
        </div>

        <span className="text-xs text-[#78909C]">
          Showing <strong>{filteredEnrollments.length}</strong> of {enrollments.length} Students • Click any session cell to toggle status
        </span>
      </div>

      {/* Interactive Session Attendance Matrix Table */}
      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF8F5] border-b border-[#E5D8B8] text-[#78909C] uppercase font-semibold">
              <tr>
                <th className="p-3.5 w-8 text-center">#</th>
                <th className="p-3.5 min-w-[180px]">Student Name & Locality</th>
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
  );
}
