"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CoursesPage() {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

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

  const [batchForm, setBatchForm] = useState({
    batchName: "",
    startDate: new Date().toISOString().split("T")[0],
    scheduleInfo: "Every Sunday 5:00 PM",
    totalSessions: 8,
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

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForBatch) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/courses/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...batchForm,
          courseId: selectedCourseForBatch,
        }),
      });
      if (res.ok) {
        setIsAddBatchOpen(false);
        setBatchForm({
          batchName: "",
          startDate: new Date().toISOString().split("T")[0],
          scheduleInfo: "Every Sunday 5:00 PM",
          totalSessions: 8,
        });
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
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
              <div className="flex items-center justify-between">
                <Badge variant={course.status === "ACTIVE" ? "emerald" : "neutral"} size="sm">
                  {course.status}
                </Badge>
                <span className="text-xs font-semibold text-[#B8860B]">
                  {course.totalSessions} Total Sessions
                </span>
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
                      onClick={() => {
                        setSelectedCourseForBatch(course.id);
                        setIsAddBatchOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#00A896] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Batch
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {course.batches && course.batches.length > 0 ? (
                    course.batches.map((batch: any) => (
                      <div
                        key={batch.id}
                        className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#08415C] flex items-center gap-2">
                            <span>{batch.batchName}</span>
                            <span className="text-[10px] font-normal text-stone-500 font-mono">
                              ({batch.enrollments?.length || 0} Members)
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-500">{batch.scheduleInfo}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasPermission("courses:manage") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBatchForEnroll(batch.id);
                                setIsEnrollOpen(true);
                              }}
                              className="px-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-[#08415C] rounded-lg text-[11px] font-bold flex items-center gap-1"
                              title="Add Members to Batch"
                            >
                              <UserPlus className="w-3 h-3 text-[#00A896]" />
                              <span>+ Member</span>
                            </button>
                          )}

                          <Link
                            href={`/courses/${course.id}`}
                            className="px-2.5 py-1 bg-[#08415C] hover:bg-[#063349] text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <span>Attendance</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
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
        subtitle="Create multiple parallel or sequential batches under one master course"
      >
        <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Batch Name *</label>
            <input
              type="text"
              required
              value={batchForm.batchName}
              onChange={(e) => setBatchForm({ ...batchForm, batchName: e.target.value })}
              placeholder="e.g. Batch 2 – Sunday Evening"
              className="w-full p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={batchForm.startDate}
                onChange={(e) => setBatchForm({ ...batchForm, startDate: e.target.value })}
                className="w-full p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 uppercase mb-1">Number of Sessions</label>
              <input
                type="number"
                min={1}
                max={50}
                value={batchForm.totalSessions}
                onChange={(e) => setBatchForm({ ...batchForm, totalSessions: parseInt(e.target.value) || 8 })}
                className="w-full p-2.5 border border-stone-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase mb-1">Schedule Info (Day & Time)</label>
            <input
              type="text"
              value={batchForm.scheduleInfo}
              onChange={(e) => setBatchForm({ ...batchForm, scheduleInfo: e.target.value })}
              placeholder="e.g. Every Sunday 6:00 PM - 7:30 PM"
              className="w-full p-2.5 border border-stone-300 rounded-xl"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddBatchOpen(false)}
              className="px-4 py-2 border rounded-xl text-stone-600 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#08415C] text-white rounded-xl font-bold"
            >
              {submitting ? "Creating..." : "Save Batch"}
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
    </div>
  );
}
