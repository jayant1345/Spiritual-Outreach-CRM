"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
import BatchBulkImportModal from "@/components/courses/BatchBulkImportModal";
import EditBatchModal from "@/components/courses/EditBatchModal";
import EditCourseModal from "@/components/courses/EditCourseModal";
import {
  GraduationCap,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  UserPlus,
  FileSpreadsheet,
  PhoneCall,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getWeekdayIndex(dayName: string): number {
  return WEEKDAYS.findIndex((d) => d.toLowerCase() === dayName.toLowerCase());
}

function getNextDateForWeekday(targetDayName: string, baseDateStr?: string): string {
  const targetIdx = getWeekdayIndex(targetDayName);
  if (targetIdx === -1) return baseDateStr || "";

  let base = new Date();
  if (baseDateStr) {
    const [y, m, d] = baseDateStr.split("-").map(Number);
    base = new Date(y, m - 1, d, 12, 0, 0);
  }

  const currentIdx = base.getDay();
  let diff = targetIdx - currentIdx;
  if (diff < 0) diff += 7;

  const res = new Date(base.getTime());
  res.setDate(res.getDate() + diff);
  const year = res.getFullYear();
  const month = String(res.getMonth() + 1).padStart(2, "0");
  const day = String(res.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayOfWeekFromDateString(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return WEEKDAYS[date.getDay()];
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function addWeeksToDateString(baseDateStr: string, weeks: number): string {
  if (!baseDateStr) return "";
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  date.setDate(date.getDate() + weeks * 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CoursesPage() {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkBatch, setBulkBatch] = useState<any>(null);
  const [isEditBatchOpen, setIsEditBatchOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<any>(null);
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<any>(null);

  const [selectedCourseForBatch, setSelectedCourseForBatch] = useState<string>("");
  const [selectedBatchForEnroll, setSelectedBatchForEnroll] = useState<string>("");

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    facultyName: "HG Radheshyam Das",
    venue: "Main Hall, Chandkheda Center",
    totalSessions: 10,
    startDate: new Date().toISOString().split("T")[0],
  });

  const [batchForm, setBatchForm] = useState<{
    batchName: string;
    selectedWeekday: string;
    scheduleTime: string;
    startDate: string;
    scheduleInfo: string;
    totalSessions: number;
    customSessions: Array<{
      sessionNumber: number;
      title: string;
      sessionDate: string;
      sessionTime: string;
    }>;
    showCustomSessions: boolean;
  }>({
    batchName: "",
    selectedWeekday: "Saturday",
    scheduleTime: "6:30 PM",
    startDate: getNextDateForWeekday("Saturday"),
    scheduleInfo: "Every Saturday 6:30 PM",
    totalSessions: 8,
    customSessions: [],
    showCustomSessions: false,
  });

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchMembers();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/people");
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      });
      if (res.ok) {
        setIsAddCourseOpen(false);
        setCourseForm({
          title: "",
          description: "",
          facultyName: "HG Radheshyam Das",
          venue: "Main Hall, Chandkheda Center",
          totalSessions: 10,
          startDate: new Date().toISOString().split("T")[0],
        });
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddBatch = (courseId: string) => {
    setSelectedCourseForBatch(courseId);
    const initialDay = "Saturday";
    const initialStartDate = getNextDateForWeekday(initialDay);
    const initialTime = "6:30 PM";
    const initialSchedule = `Every ${initialDay} ${initialTime}`;
    const total = 8;

    const initialSessions = Array.from({ length: total }, (_, i) => ({
      sessionNumber: i + 1,
      title: `Session ${i + 1}`,
      sessionDate: addWeeksToDateString(initialStartDate, i),
      sessionTime: initialSchedule,
    }));

    setBatchForm({
      batchName: `Batch (${initialDay} Class)`,
      selectedWeekday: initialDay,
      scheduleTime: initialTime,
      startDate: initialStartDate,
      scheduleInfo: initialSchedule,
      totalSessions: total,
      customSessions: initialSessions,
      showCustomSessions: false,
    });
    setIsAddBatchOpen(true);
  };

  const handleBatchWeekdayChange = (day: string) => {
    const updatedSchedule = `Every ${day} ${batchForm.scheduleTime}`;
    const snapped = getNextDateForWeekday(day, batchForm.startDate || undefined);
    const updatedSessions = Array.from({ length: batchForm.totalSessions }, (_, i) => ({
      sessionNumber: i + 1,
      title: `Session ${i + 1}`,
      sessionDate: addWeeksToDateString(snapped, i),
      sessionTime: updatedSchedule,
    }));

    setBatchForm((prev) => ({
      ...prev,
      selectedWeekday: day,
      scheduleInfo: updatedSchedule,
      startDate: snapped,
      customSessions: updatedSessions,
    }));
  };

  const handleBatchTimeChange = (time: string) => {
    const updatedSchedule = `Every ${batchForm.selectedWeekday} ${time}`;
    setBatchForm((prev) => ({
      ...prev,
      scheduleTime: time,
      scheduleInfo: updatedSchedule,
      customSessions: prev.customSessions.map((s) => ({ ...s, sessionTime: updatedSchedule })),
    }));
  };

  const handleBatchStartDateChange = (dateVal: string) => {
    const detectedDay = dateVal ? getDayOfWeekFromDateString(dateVal) : batchForm.selectedWeekday;
    const updatedSchedule = `Every ${detectedDay || batchForm.selectedWeekday} ${batchForm.scheduleTime}`;
    const updatedSessions = Array.from({ length: batchForm.totalSessions }, (_, i) => ({
      sessionNumber: i + 1,
      title: `Session ${i + 1}`,
      sessionDate: addWeeksToDateString(dateVal, i),
      sessionTime: updatedSchedule,
    }));

    setBatchForm((prev) => ({
      ...prev,
      startDate: dateVal,
      selectedWeekday: detectedDay || prev.selectedWeekday,
      scheduleInfo: updatedSchedule,
      customSessions: updatedSessions,
    }));
  };

  const handleBatchTotalSessionsChange = (num: number) => {
    const count = Math.max(1, Math.min(50, num));
    const updatedSessions = Array.from({ length: count }, (_, i) => {
      const existing = batchForm.customSessions[i];
      return existing || {
        sessionNumber: i + 1,
        title: `Session ${i + 1}`,
        sessionDate: addWeeksToDateString(batchForm.startDate, i),
        sessionTime: batchForm.scheduleInfo,
      };
    });

    setBatchForm((prev) => ({
      ...prev,
      totalSessions: count,
      customSessions: updatedSessions,
    }));
  };

  const handleSnapBatchWeekday = (targetDay: string) => {
    const snapped = getNextDateForWeekday(targetDay, batchForm.startDate || undefined);
    const updatedSchedule = `Every ${targetDay} ${batchForm.scheduleTime}`;
    const updatedSessions = Array.from({ length: batchForm.totalSessions }, (_, i) => ({
      sessionNumber: i + 1,
      title: `Session ${i + 1}`,
      sessionDate: addWeeksToDateString(snapped, i),
      sessionTime: updatedSchedule,
    }));

    setBatchForm((prev) => ({
      ...prev,
      selectedWeekday: targetDay,
      startDate: snapped,
      scheduleInfo: updatedSchedule,
      customSessions: updatedSessions,
    }));
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForBatch) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseForBatch,
          batchName: batchForm.batchName.trim(),
          startDate: batchForm.startDate,
          scheduleInfo: batchForm.scheduleInfo.trim(),
          totalSessions: batchForm.totalSessions,
          sessions:
            batchForm.showCustomSessions && batchForm.customSessions.length > 0
              ? batchForm.customSessions
              : undefined,
        }),
      });
      if (res.ok) {
        setIsAddBatchOpen(false);
        fetchCourses();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create batch");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating batch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForEnroll || !selectedMemberId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchForEnroll,
          personId: selectedMemberId,
        }),
      });
      if (res.ok) {
        setIsEnrollOpen(false);
        setSelectedMemberId("");
        fetchCourses();
      } else {
        const d = await res.json();
        alert(d.error || "Enrollment failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    const confirmation = prompt(
      `⚠️ WARNING: Deleting batch "${batchName}" will permanently remove all associated sessions, enrollments, and attendance records.\n\nType "DELETE" to confirm:`
    );
    if (confirmation !== "DELETE") {
      return;
    }
    try {
      const res = await fetch(`/api/courses/batches?id=${batchId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCourses();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete batch");
      }
    } catch (err) {
      console.error("Delete batch error:", err);
      alert("Error deleting batch");
    }
  };

  const handleOpenEditCourse = (course: any) => {
    setCourseToEdit(course);
    setIsEditCourseOpen(true);
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmation = prompt(
      `⚠️ WARNING: Deleting course "${courseTitle}" will permanently delete this course and all associated batches, sessions, enrollments, and attendance records.\n\nType "DELETE" to confirm:`
    );
    if (confirmation !== "DELETE") {
      return;
    }
    try {
      const res = await fetch(`/api/courses?id=${courseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCourses();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete course");
      }
    } catch (err) {
      console.error("Delete course error:", err);
      alert("Error deleting course");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] flex items-center gap-2">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
            Courses & Batches Management
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78909C] mt-0.5">
            Course ➔ Batch ➔ Members ➔ Sessions ➔ Attendance Matrix structure
          </p>
        </div>

        {hasPermission("courses:manage") && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddCourseOpen(true)}
              className="px-3.5 py-2 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-bold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Create Course</span>
            </button>
          </div>
        )}
      </div>

      {/* Courses & Batches List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {courses.map((course) => {
          const stats = course.stats || {
            totalStudents: 50,
            regularCount: 38,
            irregularCount: 7,
            lowCount: 3,
          };

          return (
            <div key={course.id} className="gold-card p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={course.status === "ACTIVE" ? "emerald" : "neutral"} size="sm">
                    {course.status}
                  </Badge>
                  {course.courseType && (
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                      {course.courseType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#B8860B] mr-1 hidden sm:inline">
                    {course.totalSessions} Sessions
                  </span>

                  {hasPermission("courses:manage") && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCourse(course)}
                        className="px-2.5 py-1 text-xs font-bold text-[#08415C] hover:bg-[#08415C]/10 border border-stone-200 rounded-lg flex items-center gap-1 transition shadow-xs"
                        title="Edit / Customize this course"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Edit Course</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete this course permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#08415C]">
                  {course.title}
                </h3>
                <p className="text-xs text-[#78909C] mt-0.5">
                  Speaker: <strong>{course.facultyName || "HG Radheshyam Das"}</strong> • Venue: {course.venue}
                </p>
              </div>

              {/* Batches Section Under This Course */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs font-bold text-[#08415C]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Active Batches ({course.batches?.length || 0})
                  </span>

                  {hasPermission("courses:manage") && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddBatch(course.id)}
                      className="text-[11px] font-bold text-[#00A896] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Batch
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {course.batches && course.batches.length > 0 ? (
                    course.batches.map((batch: any) => (
                      <div
                        key={batch.id}
                        className="p-3.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[#08415C] flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{batch.batchName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {batch.enrollments?.length || 0} Devotees
                            </span>
                            {batch.active === false && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">{batch.scheduleInfo}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-start md:justify-end">
                          {hasPermission("courses:manage") && (
                            <button
                              type="button"
                              onClick={() => {
                                setBulkBatch({
                                  id: batch.id,
                                  batchName: batch.batchName,
                                  courseTitle: course.title,
                                });
                                setIsBulkImportOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                              title="Bulk Excel Import or Multi-select Members into this Batch"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-700" />
                              <span>📥 Bulk / Excel</span>
                            </button>
                          )}

                          <Link
                            href={`/calling-sewa?batch=${encodeURIComponent(batch.batchName)}`}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-[#08415C] rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                            title="Open Calling Desk filtered for this Batch"
                          >
                            <PhoneCall className="w-3 h-3 text-[#00A896]" />
                            <span>Calling</span>
                          </Link>

                          <Link
                            href={`/courses/${course.id}?batchId=${batch.id}`}
                            className="px-2.5 py-1.5 bg-[#08415C] hover:bg-[#063349] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-gold transition"
                            title="Open Session Attendance Grid"
                          >
                            <span>Attendance</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          {hasPermission("courses:manage") && (
                            <div className="flex items-center gap-1 border-l border-stone-200 pl-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBatchForEnroll(batch.id);
                                  setIsEnrollOpen(true);
                                }}
                                className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-[#00A896] rounded-lg"
                                title="Add Single Member from Directory"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setBatchToEdit({
                                    id: batch.id,
                                    batchName: batch.batchName,
                                    scheduleInfo: batch.scheduleInfo,
                                    startDate: batch.startDate,
                                    active: batch.active,
                                    courseTitle: course.title,
                                    sessions: batch.sessions,
                                  });
                                  setIsEditBatchOpen(true);
                                }}
                                className="px-2 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-[#08415C] rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition"
                                title="Edit batch name, schedule, start date & customize individual sessions"
                              >
                                <Edit2 className="w-3 h-3 text-[#08415C]" />
                                <span>Edit / Customize</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBatch(batch.id, batch.batchName)}
                                className="p-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-lg transition"
                                title="Delete Batch Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
                      No batches created yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Regularity KPI Pills */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#08415C]">
                  <span>Member Regularity:</span>
                  <span>{stats.totalStudents} Enrolled</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-300">
                    <div className="font-bold text-emerald-800 text-sm">{stats.regularCount}</div>
                    <div className="text-[9px] text-emerald-700">Regular (≥75%)</div>
                  </div>
                  <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-300">
                    <div className="font-bold text-amber-800 text-sm">{stats.irregularCount}</div>
                    <div className="text-[9px] text-amber-700">Irregular</div>
                  </div>
                  <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-200">
                    <div className="font-bold text-rose-800 text-sm">{stats.lowCount}</div>
                    <div className="text-[9px] text-rose-700">Low (&lt;50%)</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5D8B8]/60 flex justify-end">
                <Link
                  href={`/courses/${course.id}`}
                  className="px-3.5 py-2 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-bold rounded-xl shadow-gold flex items-center gap-1.5 transition"
                >
                  <TableProperties className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Launch Session Attendance Grid</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Course */}
      <Modal
        isOpen={isAddCourseOpen}
        onClose={() => setIsAddCourseOpen(false)}
        title="Create New Course"
        subtitle="Define spiritual academic curriculum at Chandkheda Center"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              placeholder="e.g. Gita Shiksha Course (Module 1)"
              className="w-full p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">Faculty / Speaker</label>
              <input
                type="text"
                value={courseForm.facultyName}
                onChange={(e) => setCourseForm({ ...courseForm, facultyName: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">Total Sessions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={courseForm.totalSessions}
                onChange={(e) => setCourseForm({ ...courseForm, totalSessions: parseInt(e.target.value) || 10 })}
                className="w-full p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Venue</label>
            <input
              type="text"
              value={courseForm.venue}
              onChange={(e) => setCourseForm({ ...courseForm, venue: e.target.value })}
              className="w-full p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddCourseOpen(false)}
              className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#08415C] text-white rounded-xl font-bold"
            >
              {submitting ? "Creating..." : "Save Course"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Batch */}
      <Modal
        isOpen={isAddBatchOpen}
        onClose={() => setIsAddBatchOpen(false)}
        title="Add Batch under Course"
        subtitle="Configure schedule routine, verify start date & customize sessions before creating"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs max-h-[80vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Batch Name *</label>
            <input
              type="text"
              required
              value={batchForm.batchName}
              onChange={(e) => setBatchForm({ ...batchForm, batchName: e.target.value })}
              placeholder="e.g. Batch 1 (Saturday Evening)"
              className="w-full p-2.5 border border-stone-300 rounded-xl font-semibold text-stone-800 outline-none focus:border-[#08415C]"
            />
          </div>

          {/* Quick Weekday & Time Chooser */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-2">
            <label className="block font-bold text-[#08415C] uppercase text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              Schedule Day of Week &amp; Time
            </label>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => {
                const isSelected = batchForm.selectedWeekday.toLowerCase() === day.toLowerCase();
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleBatchWeekdayChange(day)}
                    className={`py-1.5 px-1 rounded-lg text-center font-bold text-[11px] transition ${
                      isSelected
                        ? "bg-[#08415C] text-white shadow-xs"
                        : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-0.5">
                  Time
                </label>
                <input
                  type="text"
                  value={batchForm.scheduleTime}
                  onChange={(e) => handleBatchTimeChange(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-800 outline-none focus:border-[#08415C] font-semibold"
                  placeholder="e.g. 6:30 PM"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-0.5">
                  Schedule Text
                </label>
                <input
                  type="text"
                  value={batchForm.scheduleInfo}
                  onChange={(e) => setBatchForm({ ...batchForm, scheduleInfo: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-800 outline-none focus:border-[#08415C]"
                  placeholder="e.g. Every Saturday 6:30 PM"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-stone-700 uppercase">Start Date *</label>
                {batchForm.startDate && (
                  <span className="text-[10px] font-bold text-[#08415C] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5D8B8]">
                    {formatDisplayDate(batchForm.startDate)}
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={batchForm.startDate}
                onChange={(e) => handleBatchStartDateChange(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-xl font-semibold text-stone-800 outline-none focus:border-[#08415C]"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">Number of Sessions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={batchForm.totalSessions}
                onChange={(e) => handleBatchTotalSessionsChange(parseInt(e.target.value) || 8)}
                className="w-full p-2.5 border border-stone-300 rounded-xl font-semibold text-stone-800 outline-none focus:border-[#08415C]"
              />
            </div>
          </div>

          {/* Weekday Mismatch Alert & Auto Snap */}
          {batchForm.startDate &&
            getDayOfWeekFromDateString(batchForm.startDate).toLowerCase() !==
              batchForm.selectedWeekday.toLowerCase() && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Start Date is <strong>{getDayOfWeekFromDateString(batchForm.startDate)}</strong>, but schedule is set for <strong>{batchForm.selectedWeekday}</strong>!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSnapBatchWeekday(batchForm.selectedWeekday)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 whitespace-nowrap shadow-xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Snap to next {batchForm.selectedWeekday}</span>
                </button>
              </div>
            )}

          {/* Schedule Preview Grid */}
          {batchForm.startDate && (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Generated Schedule Preview:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {batchForm.customSessions.slice(0, 4).map((s, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] px-2 py-1 bg-white/90 rounded-lg border border-emerald-200 flex items-center justify-between"
                  >
                    <span className="font-bold text-emerald-900">S{s.sessionNumber}:</span>
                    <span className="text-stone-700 font-mono text-[10px]">
                      {formatDisplayDate(s.sessionDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Custom Sessions Editor */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setBatchForm((prev) => ({
                  ...prev,
                  showCustomSessions: !prev.showCustomSessions,
                }))
              }
              className="w-full p-2.5 bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-left font-bold text-stone-700 transition"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#08415C]" />
                <span>Fine-Tune Individual Sessions ({batchForm.totalSessions} Sessions)</span>
              </div>
              {batchForm.showCustomSessions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {batchForm.showCustomSessions && (
              <div className="p-2.5 max-h-52 overflow-y-auto space-y-2 bg-white divide-y divide-stone-100">
                {batchForm.customSessions.map((sess, idx) => (
                  <div
                    key={idx}
                    className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded bg-stone-100 font-bold text-stone-600 flex items-center justify-center text-[10px] flex-shrink-0">
                        S{sess.sessionNumber}
                      </span>
                      <input
                        type="text"
                        value={sess.title}
                        onChange={(e) => {
                          const updated = [...batchForm.customSessions];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setBatchForm((prev) => ({ ...prev, customSessions: updated }));
                        }}
                        className="p-1 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 outline-none focus:border-[#08415C] flex-1"
                        placeholder={`Session ${sess.sessionNumber} Title`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={sess.sessionDate}
                        onChange={(e) => {
                          const updated = [...batchForm.customSessions];
                          updated[idx] = { ...updated[idx], sessionDate: e.target.value };
                          setBatchForm((prev) => ({ ...prev, customSessions: updated }));
                        }}
                        className="p-1 border border-stone-300 rounded-lg text-[11px] font-mono outline-none focus:border-[#08415C]"
                      />
                      {sess.sessionDate && (
                        <span className="text-[10px] font-semibold text-stone-500 whitespace-nowrap bg-stone-50 px-1 py-0.5 rounded border border-stone-200">
                          {getDayOfWeekFromDateString(sess.sessionDate).slice(0, 3)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(false)}
              className="px-4 py-2 border rounded-xl text-stone-600 font-bold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl font-bold shadow-gold transition disabled:opacity-60 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>{submitting ? "Creating..." : "Save Batch"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Enroll Member into Batch */}
      <Modal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        title="Add Member to Batch"
        subtitle="Select existing member from Members Directory without creating duplicate contacts"
      >
        <form onSubmit={handleEnrollMember} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Select Member *</label>
            <select
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-semibold"
            >
              <option value="">Choose member from directory...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} (+91 {m.mobile}) — {m.stage}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            Enrolling will link the member to this batch's attendance matrix while keeping their single master profile intact.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEnrollOpen(false)}
              className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedMemberId}
              className="px-4 py-2 bg-[#08415C] text-white rounded-xl font-bold disabled:opacity-60"
            >
              {submitting ? "Enrolling..." : "Enroll Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk / Excel Import into Batch */}
      <BatchBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => {
          setIsBulkImportOpen(false);
          setBulkBatch(null);
        }}
        batch={bulkBatch}
        members={members}
        onSuccess={() => fetchCourses()}
      />

      {/* Modal: Edit Batch */}
      <EditBatchModal
        isOpen={isEditBatchOpen}
        onClose={() => {
          setIsEditBatchOpen(false);
          setBatchToEdit(null);
        }}
        batch={batchToEdit}
        onSuccess={() => fetchCourses()}
      />

      {/* Modal: Edit Course */}
      <EditCourseModal
        isOpen={isEditCourseOpen}
        onClose={() => {
          setIsEditCourseOpen(false);
          setCourseToEdit(null);
        }}
        course={courseToEdit}
        onCourseUpdated={() => fetchCourses()}
        onCourseDeleted={() => fetchCourses()}
      />
    </div>
  );
}
