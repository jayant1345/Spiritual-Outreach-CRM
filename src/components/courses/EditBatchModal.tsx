"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Edit2, CheckCircle2, AlertCircle, Calendar, ChevronDown, ChevronUp, Clock, Sparkles } from "lucide-react";

interface SessionItem {
  id: string;
  sessionNumber: number;
  title: string;
  sessionDate: string;
  sessionTime?: string;
  completed?: boolean;
}

interface EditBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: {
    id: string;
    batchName: string;
    scheduleInfo?: string;
    startDate?: string;
    active?: boolean;
    courseTitle?: string;
    sessions?: Array<{
      id: string;
      sessionNumber: number;
      title?: string;
      sessionDate?: string;
      sessionTime?: string;
      completed?: boolean;
    }>;
  } | null;
  onSuccess: () => void;
}

function formatDateToInput(dateValue?: string | Date): string {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function EditBatchModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}: EditBatchModalProps) {
  const [batchName, setBatchName] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [active, setActive] = useState(true);
  const [syncSessionDates, setSyncSessionDates] = useState(true);
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setBatchName(batch.batchName || "");
      setScheduleInfo(batch.scheduleInfo || "");
      const initStartDate = formatDateToInput(batch.startDate);
      setStartDate(initStartDate);
      setActive(batch.active !== undefined ? batch.active : true);
      setSyncSessionDates(true);
      setError(null);

      // Populate existing sessions
      if (batch.sessions && batch.sessions.length > 0) {
        const sorted = [...batch.sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
        setSessionsList(
          sorted.map((s) => ({
            id: s.id,
            sessionNumber: s.sessionNumber,
            title: s.title || `Session ${s.sessionNumber}`,
            sessionDate: formatDateToInput(s.sessionDate),
            sessionTime: s.sessionTime || batch.scheduleInfo || "",
            completed: Boolean(s.completed),
          }))
        );
      } else {
        setSessionsList([]);
      }
    }
  }, [batch]);

  // When startDate changes and syncSessionDates is ON, recalculate all session dates
  const handleStartDateChange = (newDateStr: string) => {
    setStartDate(newDateStr);
    if (syncSessionDates && newDateStr && sessionsList.length > 0) {
      setSessionsList((prev) =>
        prev.map((s, idx) => ({
          ...s,
          sessionDate: addWeeksToDateString(newDateStr, idx),
        }))
      );
    }
  };

  const handleSyncToggle = (checked: boolean) => {
    setSyncSessionDates(checked);
    if (checked && startDate && sessionsList.length > 0) {
      setSessionsList((prev) =>
        prev.map((s, idx) => ({
          ...s,
          sessionDate: addWeeksToDateString(startDate, idx),
        }))
      );
    }
  };

  const handleSessionDateChange = (index: number, newDate: string) => {
    setSessionsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sessionDate: newDate };
      return updated;
    });
  };

  if (!batch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) {
      setError("Batch name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build sessions payload if custom overrides exist
      const sessionsPayload = sessionsList.map((s) => ({
        id: s.id,
        sessionDate: s.sessionDate ? new Date(`${s.sessionDate}T12:00:00Z`).toISOString() : undefined,
        sessionTime: scheduleInfo.trim(),
        title: s.title,
        completed: s.completed,
      }));

      const res = await fetch("/api/courses/batches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: batch.id,
          batchName: batchName.trim(),
          scheduleInfo: scheduleInfo.trim(),
          startDate: startDate ? new Date(`${startDate}T12:00:00Z`).toISOString() : undefined,
          active,
          syncSessionDates,
          sessions: sessionsPayload.length > 0 ? sessionsPayload : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to update batch");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Course Batch & Schedule"
      subtitle={`Update details & session dates for ${batch.courseTitle || "Course"} batch`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block font-bold text-stone-700 uppercase mb-1">
            Batch Name *
          </label>
          <input
            type="text"
            required
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full p-2.5 border border-stone-300 rounded-xl font-semibold text-stone-800 outline-none focus:border-[#08415C]"
            placeholder="e.g. Batch 1 (Saturday Evening)"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase mb-1">
            Schedule Info (Day &amp; Time)
          </label>
          <input
            type="text"
            value={scheduleInfo}
            onChange={(e) => setScheduleInfo(e.target.value)}
            className="w-full p-2.5 border border-stone-300 rounded-xl text-stone-800 outline-none focus:border-[#08415C]"
            placeholder="e.g. Every Saturday 6:30 PM"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700 uppercase">
              Start Date (First Session) *
            </label>
            {startDate && (
              <span className="text-[11px] font-bold text-[#08415C] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E5D8B8]">
                {formatDisplayDate(startDate)}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-xl text-stone-800 outline-none focus:border-[#08415C] font-semibold"
            />
          </div>
        </div>

        {/* Sync Session Dates Checkbox */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="syncSessionDates"
              checked={syncSessionDates}
              onChange={(e) => handleSyncToggle(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#08415C] rounded border-stone-300 focus:ring-0"
            />
            <label htmlFor="syncSessionDates" className="font-bold text-emerald-950 cursor-pointer">
              Auto-sync all session dates to this start date (Weekly intervals)
              <span className="block text-[11px] font-normal text-emerald-800 mt-0.5">
                Each subsequent session will automatically be scheduled 7 days apart starting from the Start Date.
              </span>
            </label>
          </div>

          {/* Quick Schedule Preview */}
          {startDate && (
            <div className="pt-1.5 border-t border-emerald-200/60">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Calculated Schedule Preview:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[0, 1, 2, 3].map((weekIdx) => {
                  const sDate = addWeeksToDateString(startDate, weekIdx);
                  return (
                    <div key={weekIdx} className="text-[11px] px-2 py-1 bg-white/80 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span className="font-bold text-emerald-900">S{weekIdx + 1}:</span>
                      <span className="text-stone-700 font-mono text-[10px]">{formatDisplayDate(sDate)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Expandable Individual Session Editor */}
        {sessionsList.length > 0 && (
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSessionsList(!showSessionsList)}
              className="w-full p-2.5 bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-between text-left font-bold text-stone-700 transition"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#08415C]" />
                <span>Fine-Tune Individual Sessions ({sessionsList.length} Sessions)</span>
              </div>
              {showSessionsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSessionsList && (
              <div className="p-2.5 max-h-56 overflow-y-auto space-y-2 bg-white divide-y divide-stone-100">
                {sessionsList.map((sess, idx) => (
                  <div key={sess.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-stone-800 truncate">
                        S{sess.sessionNumber}: {sess.title}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {sess.sessionDate ? formatDisplayDate(sess.sessionDate) : "Date unset"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={sess.sessionDate}
                        onChange={(e) => handleSessionDateChange(idx, e.target.value)}
                        className="p-1 border border-stone-300 rounded-lg text-[11px] font-mono outline-none focus:border-[#08415C]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="batchActive"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-[#08415C] rounded border-stone-300"
          />
          <label htmlFor="batchActive" className="font-semibold text-stone-700 cursor-pointer">
            Active Batch (accepting attendees &amp; calling sewa)
          </label>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-stone-600 font-bold hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl font-bold shadow-gold flex items-center gap-1.5 transition disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
