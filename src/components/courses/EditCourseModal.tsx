"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import Badge from "@/components/common/Badge";
import {
  GraduationCap,
  Layers,
  Calendar,
  Clock,
  Trash2,
  Save,
  AlertTriangle,
  User,
  MapPin,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  courseType?: string;
  facultyName?: string;
  venue?: string;
  totalSessions: number;
  startDate?: string | Date;
  description?: string;
  status: string;
  batches?: any[];
}

interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onCourseUpdated: () => void;
  onCourseDeleted?: () => void;
}

const COURSE_TYPES = [
  "Spiritual Foundation Course",
  "Bhagavad Gita Study",
  "Bhakti Sastri & Deep Scripture",
  "Youth Seminar & Workshop",
  "Kids Cultural School",
  "Weekend Satsang Series",
];

const COURSE_STATUSES = ["ACTIVE", "UPCOMING", "COMPLETED"];

export default function EditCourseModal({
  isOpen,
  onClose,
  course,
  onCourseUpdated,
  onCourseDeleted,
}: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    courseType: "Spiritual Foundation Course",
    facultyName: "HG Radheshyam Das",
    venue: "Main Hall, Chandkheda Center",
    totalSessions: 10,
    startDate: "",
    description: "",
    status: "ACTIVE",
  });

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      let sDate = "";
      if (course.startDate) {
        const d = new Date(course.startDate);
        if (!isNaN(d.getTime())) {
          sDate = d.toISOString().split("T")[0];
        }
      }

      setFormData({
        title: course.title || "",
        courseType: course.courseType || "Spiritual Foundation Course",
        facultyName: course.facultyName || "HG Radheshyam Das",
        venue: course.venue || "Main Hall, Chandkheda Center",
        totalSessions: course.totalSessions || 10,
        startDate: sDate || new Date().toISOString().split("T")[0],
        description: course.description || "",
        status: course.status || "ACTIVE",
      });

      setShowDeleteZone(false);
      setDeleteConfirmText("");
      setError(null);
    }
  }, [course]);

  if (!course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Course title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: course.id,
          title: formData.title.trim(),
          courseType: formData.courseType.trim(),
          facultyName: formData.facultyName.trim(),
          venue: formData.venue.trim(),
          totalSessions: Number(formData.totalSessions) || 10,
          startDate: formData.startDate,
          description: formData.description.trim(),
          status: formData.status,
        }),
      });

      if (res.ok) {
        onCourseUpdated();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update course");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm course removal.');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/courses?id=${course.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onCourseDeleted) onCourseDeleted();
        else onCourseUpdated();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete course");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting course");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✏️ Edit & Customize Course"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Gita Shiksha Level 1"
              className="w-full text-sm font-semibold p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Course Category / Type
              </label>
              <select
                value={formData.courseType}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
              >
                {COURSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {COURSE_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st })}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                      formData.status === st
                        ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                        : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {st === "ACTIVE" ? "🟢 Active" : st === "UPCOMING" ? "⏳ Upcoming" : "🏁 Done"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" /> Faculty / Speaker
              </label>
              <input
                type="text"
                value={formData.facultyName}
                onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                placeholder="HG Radheshyam Das"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00A896]" /> Venue / Location
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Main Hall, Chandkheda Center"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#08415C]" /> Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#B8860B]" /> Total Planned Sessions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.totalSessions}
                onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 1 })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-500" /> Description &amp; Syllabus Notes
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline course objectives, prerequisites, materials, or target audience..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>
        </div>

        {/* Linked Batches Preview */}
        {course.batches && course.batches.length > 0 && (
          <div className="pt-2 border-t border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#08415C]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Active Batches in this Course ({course.batches.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {course.batches.map((b: any) => (
                <div
                  key={b.id}
                  className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center justify-between shadow-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[#08415C] block truncate">{b.batchName}</span>
                    <span className="text-[11px] text-stone-500 block truncate">{b.scheduleInfo}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ml-2 whitespace-nowrap">
                    {b.enrollments?.length || 0} devotees
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {!showDeleteZone ? (
              <button
                type="button"
                onClick={() => setShowDeleteZone(true)}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Course...</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-600 text-xs font-semibold rounded-xl hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-bold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>{submitting ? "Saving..." : "Save Course Changes"}</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Danger Zone */}
        {showDeleteZone && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-3 mt-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed">
                <span className="font-bold">Permanent Course Deletion:</span> This will permanently delete course{" "}
                <strong>&quot;{course.title}&quot;</strong> along with all its batches, sessions, devotee enrollments, and attendance matrix logs.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-rose-700">
                Type &quot;DELETE&quot; in capital letters to confirm:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="text-xs font-mono p-2 border border-rose-300 rounded-xl bg-white text-rose-800 focus:ring-2 focus:ring-rose-500 outline-none w-36"
                />
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-40 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? "Deleting..." : "Permanently Delete Course"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteZone(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-3 py-2 text-stone-600 hover:text-stone-800 text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
