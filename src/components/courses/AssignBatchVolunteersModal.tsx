"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AssignBatchVolunteersModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: {
    id: string;
    batchName: string;
    courseTitle?: string;
  } | null;
  onAssigned?: () => void;
}

export const AssignBatchVolunteersModal: React.FC<AssignBatchVolunteersModalProps> = ({
  isOpen,
  onClose,
  batch,
  onAssigned,
}) => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load volunteers and current assignments on modal open
  useEffect(() => {
    if (!isOpen || !batch?.id) {
      setVolunteers([]);
      setSelectedIds([]);
      setInitialAssignedIds([]);
      setSearchQuery("");
      setErrorMsg(null);
      setSuccessMsg(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/courses/batches/volunteers?batchId=${batch.id}`);
        if (!res.ok) {
          throw new Error("Failed to load batch volunteers");
        }
        const data = await res.json();
        setVolunteers(data.allVolunteers || []);
        setSelectedIds(data.assignedUserIds || []);
        setInitialAssignedIds(data.assignedUserIds || []);
      } catch (err: any) {
        console.error("Error loading volunteers for batch:", err);
        setErrorMsg(err.message || "Failed to load volunteers");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, batch?.id]);

  if (!isOpen || !batch) return null;

  const toggleVolunteer = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredVolunteers.map((v) => v.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredVolunteers.map((v) => v.id));
    setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
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
          batchId: batch.id,
          volunteerIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save batch rights");
      }

      setSuccessMsg(`Successfully granted batch rights to ${selectedIds.length} devotee(s)!`);
      if (onAssigned) {
        onAssigned();
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Error saving batch rights:", err);
      setErrorMsg(err.message || "Failed to save batch rights");
    } finally {
      setSaving(false);
    }
  };

  const filteredVolunteers = volunteers.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = v.name?.toLowerCase().includes(q);
    const phoneMatch = v.phone?.toLowerCase().includes(q);
    const roleMatch = v.role?.toLowerCase().includes(q);
    return nameMatch || phoneMatch || roleMatch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Super Admin</span>;
      case "COORDINATOR":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">Coordinator</span>;
      case "CALLING_VOLUNTEER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Caller</span>;
      case "RELATIONSHIP_VOLUNTEER":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Counselor</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">{role}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5D8B8] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5D8B8] bg-gradient-to-r from-white via-[#FAF5E6] to-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C] leading-tight">
                Batch Sewa Rights & Sevak Assignment
              </h3>
              <p className="text-xs text-stone-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#08415C]">{batch.batchName}</span>
                {batch.courseTitle && (
                  <>
                    <span>•</span>
                    <span className="text-stone-500">{batch.courseTitle}</span>
                  </>
                )}
              </p>
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
        <div className="px-4 py-2.5 bg-[#FAF5E6]/80 border-b border-[#E5D8B8]/60 text-[11px] text-stone-700 flex items-start gap-2">
          <span className="text-base leading-none">ℹ️</span>
          <span>
            Selected devotees will receive calling & view rights for <strong>{batch.batchName}</strong> only. Other batches will remain hidden from them so they can focus on their seva.
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 border-b border-stone-100 space-y-2 bg-[#FAF8F5]/50">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devotee by name, phone, or role..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs outline-none focus:border-[#08415C] transition shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#08415C]">
              <UserCheck className="w-3.5 h-3.5 text-[#00A896]" />
              <span>
                {selectedIds.length} of {volunteers.length} Sevaks Selected
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[#08415C] font-semibold hover:underline"
              >
                Select All
              </button>
              <span className="text-stone-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="text-stone-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
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

        {/* Volunteers List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[45vh]">
          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <span>Loading devotee list...</span>
            </div>
          ) : filteredVolunteers.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No devotees found matching your search.
            </div>
          ) : (
            filteredVolunteers.map((vol) => {
              const isSelected = selectedIds.includes(vol.id);
              const wasInitiallyAssigned = initialAssignedIds.includes(vol.id);

              return (
                <div
                  key={vol.id}
                  onClick={() => toggleVolunteer(vol.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF5E6] border-[#D4AF37] shadow-xs"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition flex-shrink-0 ${
                        isSelected
                          ? "bg-[#08415C] border-[#08415C] text-white"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#0B192C] truncate">
                          {vol.name}
                        </span>
                        {getRoleBadge(vol.role)}
                        {wasInitiallyAssigned && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2 truncate">
                        <span>📱 {vol.phone || "No phone"}</span>
                        {vol.email && <span className="truncate">• {vol.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#E5D8B8] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600 font-medium">
            <span className="font-bold text-[#08415C]">{selectedIds.length}</span> Sevak(s) assigned
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
                  <span>Saving Rights...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Save Batch Rights</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignBatchVolunteersModal;
