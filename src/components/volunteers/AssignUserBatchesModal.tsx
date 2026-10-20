"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  GraduationCap,
  Calendar,
} from "lucide-react";

interface AssignUserBatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    role: string;
  } | null;
  onAssigned?: () => void;
}

export const AssignUserBatchesModal: React.FC<AssignUserBatchesModalProps> = ({
  isOpen,
  onClose,
  user,
  onAssigned,
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [initialAssignedBatchIds, setInitialAssignedBatchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      setCourses([]);
      setSelectedBatchIds([]);
      setInitialAssignedBatchIds([]);
      setErrorMsg(null);
      setSuccessMsg(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/courses/batches/volunteers?userId=${user.id}`);
        if (!res.ok) {
          throw new Error("Failed to load user batch rights");
        }
        const data = await res.json();
        setCourses(data.courses || []);
        setSelectedBatchIds(data.assignedBatchIds || []);
        setInitialAssignedBatchIds(data.assignedBatchIds || []);
      } catch (err: any) {
        console.error("Error loading user batches:", err);
        setErrorMsg(err.message || "Failed to load batch rights");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const toggleBatch = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const handleSelectAllInCourse = (courseBatches: any[]) => {
    const ids = courseBatches.map((b) => b.id);
    setSelectedBatchIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllInCourse = (courseBatches: any[]) => {
    const idSet = new Set(courseBatches.map((b) => b.id));
    setSelectedBatchIds((prev) => prev.filter((id) => !idSet.has(id)));
  };

  const handleClearAll = () => {
    setSelectedBatchIds([]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/courses/batches/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          batchIds: selectedBatchIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save batch allocation");
      }

      setSuccessMsg(`Successfully allocated ${selectedBatchIds.length} batch(es) to ${user.name}!`);
      if (onAssigned) {
        onAssigned();
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error saving batch allocation:", err);
      setErrorMsg(err.message || "Failed to save batch allocation");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Super Admin</span>;
      case "ADMIN":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Admin</span>;
      case "TEAM_LEADER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Team Leader</span>;
      case "COORDINATOR":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">Coordinator</span>;
      case "CALLING_VOLUNTEER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">Calling Volunteer</span>;
      case "RELATIONSHIP_VOLUNTEER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Relationship Volunteer</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">{role}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5D8B8] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5D8B8] bg-gradient-to-r from-white via-[#FAF5E6] to-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] leading-tight">
                Batch Allocation & Rights
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-bold text-xs text-stone-800">{user.name}</span>
                {getRoleBadge(user.role)}
                {user.phone && <span className="text-[11px] text-stone-500">📱 {user.phone}</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Guidance Banner */}
        <div className="px-4 py-2 bg-[#FAF5E6]/80 border-b border-[#E5D8B8]/60 text-[11px] text-stone-700 flex items-start gap-2">
          <span className="text-base leading-none">ℹ️</span>
          <span>
            Assigning batches will restrict <strong>{user.name}</strong> to view and call only devotees of the selected batches. If assigned multiple batches, they can easily switch between them.
          </span>
        </div>

        {/* Selected Summary & Clear Bar */}
        <div className="px-4 py-2 border-b border-stone-100 bg-[#FAF8F5]/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#08415C]">
            <Layers className="w-3.5 h-3.5 text-[#00A896]" />
            <span>{selectedBatchIds.length} Batch(es) Allocated</span>
          </div>
          {selectedBatchIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-stone-500 hover:text-rose-600 font-semibold text-[11px] hover:underline"
            >
              Clear All Batches
            </button>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Courses & Batches List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[50vh]">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <span>Loading courses and batches...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No active courses found.
            </div>
          ) : (
            courses.map((course) => {
              const courseBatches = course.batches || [];
              const allCourseBatchesSelected =
                courseBatches.length > 0 &&
                courseBatches.every((b: any) => selectedBatchIds.includes(b.id));

              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs"
                >
                  <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="w-4 h-4 text-[#08415C] flex-shrink-0" />
                      <h4 className="font-bold text-xs sm:text-sm text-[#08415C] truncate">
                        {course.title}
                      </h4>
                      <span className="text-[10px] text-stone-400">({courseBatches.length} Batches)</span>
                    </div>

                    {courseBatches.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] font-semibold">
                        <button
                          type="button"
                          onClick={() =>
                            allCourseBatchesSelected
                              ? handleDeselectAllInCourse(courseBatches)
                              : handleSelectAllInCourse(courseBatches)
                          }
                          className="text-[#08415C] hover:underline"
                        >
                          {allCourseBatchesSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-2 space-y-1.5">
                    {courseBatches.length === 0 ? (
                      <div className="text-[11px] text-stone-400 italic p-2">
                        No batches created for this course yet.
                      </div>
                    ) : (
                      courseBatches.map((batch: any) => {
                        const isSelected = selectedBatchIds.includes(batch.id);
                        const wasInitiallyAssigned = initialAssignedBatchIds.includes(batch.id);

                        return (
                          <div
                            key={batch.id}
                            onClick={() => toggleBatch(batch.id)}
                            className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? "bg-[#FAF5E6] border-[#D4AF37] shadow-xs"
                                : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition flex-shrink-0 ${
                                  isSelected
                                    ? "bg-[#08415C] border-[#08415C] text-white"
                                    : "border-stone-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-[#0B192C]">
                                    {batch.batchName}
                                  </span>
                                  {wasInitiallyAssigned && (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Assigned
                                    </span>
                                  )}
                                </div>
                                {batch.scheduleInfo && (
                                  <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-stone-400" />
                                    <span className="truncate">{batch.scheduleInfo}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#E5D8B8] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600 font-medium">
            <span className="font-bold text-[#08415C]">{selectedBatchIds.length}</span> Batch(es) selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-1.5 rounded-xl bg-[#08415C] hover:bg-[#063349] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Allocation...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Save Batch Allocation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignUserBatchesModal;
