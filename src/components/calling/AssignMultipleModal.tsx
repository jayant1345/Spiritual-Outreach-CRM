"use client";

import React, { useState } from "react";
import { Users, X, Bell, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

interface Volunteer {
  id: string;
  name: string;
  role: string;
}

interface AssignMultipleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  volunteers: Volunteer[];
  onSuccess: () => void;
}

export default function AssignMultipleModal({
  isOpen,
  onClose,
  selectedIds,
  volunteers,
  onSuccess,
}: AssignMultipleModalProps) {
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [note, setNote] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectVolunteer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !selectedVolunteerIds.includes(val)) {
      setSelectedVolunteerIds([...selectedVolunteerIds, val]);
    }
  };

  const handleRemoveVolunteer = (id: string) => {
    setSelectedVolunteerIds(selectedVolunteerIds.filter((vId) => vId !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVolunteerIds.length === 0) {
      setError("Please select at least one volunteer to assign these calls.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isMulti = selectedVolunteerIds.length > 1;
      const res = await fetch("/api/people/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: isMulti ? "DISTRIBUTE_VOLUNTEERS" : "ASSIGN_VOLUNTEER",
          value: isMulti ? selectedVolunteerIds : selectedVolunteerIds[0],
          volunteerIds: selectedVolunteerIds,
          priority,
          note,
          sendNotification,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign calls");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to assign calls.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C]">
                Assign Multiple Contacts
              </h3>
              <p className="text-[11px] text-stone-500">
                Bulk allocate calling seva to volunteer devottes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contacts Count Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {selectedIds.length}
            </div>
            <div className="text-[11px] leading-tight">
              <strong>{selectedIds.length} contacts selected.</strong> Assign to one volunteer, or select multiple volunteers to distribute calls equally.
            </div>
          </div>

          {/* Volunteer Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
              <span>Assign To Volunteer(s)</span>
              {selectedVolunteerIds.length > 1 && (
                <span className="text-[10px] text-emerald-700 font-normal bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Equal Round-Robin Distribution
                </span>
              )}
            </label>

            <select
              value=""
              onChange={handleSelectVolunteer}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-[#08415C]"
            >
              <option value="">+ Select volunteer to add...</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id} disabled={selectedVolunteerIds.includes(v.id)}>
                  {v.name} ({v.role.replace(/_/g, " ")})
                </option>
              ))}
            </select>

            {/* Selected Volunteer Chips */}
            {selectedVolunteerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedVolunteerIds.map((vId) => {
                  const vol = volunteers.find((v) => v.id === vId);
                  return (
                    <span
                      key={vId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#08415C]/30 text-[#08415C] rounded-lg text-xs font-bold shadow-2xs"
                    >
                      <span>{vol?.name || "Volunteer"}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVolunteer(vId)}
                        className="text-stone-400 hover:text-rose-600 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800">Set Priority</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  priority === "NORMAL"
                    ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                    : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority("HIGH")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  priority === "HIGH"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                }`}
              >
                High
              </button>
              <button
                type="button"
                onClick={() => setPriority("URGENT")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  priority === "URGENT"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* Note / Purpose */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800">
              Add Note / Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Calling for JOSD Batch 1 follow-up, remind for Sunday 6:30 PM..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#08415C]"
            />
          </div>

          {/* Send Notification Toggle */}
          <div className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#08415C]" />
              <div className="text-xs">
                <div className="font-bold text-stone-800">Send Notification to Volunteers</div>
                <div className="text-[10px] text-stone-500">
                  Instantly alerts volunteer in Bell &amp; adds to their Today&apos;s Work queue
                </div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="w-4 h-4 accent-[#08415C] rounded cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || selectedVolunteerIds.length === 0}
              className="px-5 py-2 bg-[#08415C] hover:bg-[#063349] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-gold flex items-center gap-1.5 transition"
            >
              {loading ? (
                <span>Assigning...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Assign {selectedIds.length} Contacts</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
