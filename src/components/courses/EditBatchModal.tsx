"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import {
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Trash2,
  Plus,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface SessionItem {
  id?: string;
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

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

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

function getDayOfWeekFromDateString(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return WEEKDAYS[date.getDay()];
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

function detectWeekdayFromSchedule(text: string): string | null {
  for (const day of WEEKDAYS) {
    if (new RegExp(`\\b${day}\\b`, "i").test(text)) {
      return day;
    }
  }
  return null;
}

function getNextDateForWeekday(targetDayName: string, baseDateStr?: string): string {
  const targetIdx = WEEKDAYS.findIndex((d) => d.toLowerCase() === targetDayName.toLowerCase());
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

export default function EditBatchModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}: EditBatchModalProps) {
  const [batchName, setBatchName] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState("");
  const [selectedWeekday, setSelectedWeekday] = useState<string>("Saturday");
  const [scheduleTime, setScheduleTime] = useState<string>("6:30 PM");
  const [startDate, setStartDate] = useState("");
  const [active, setActive] = useState(true);
  const [syncSessionDates, setSyncSessionDates] = useState(true);
  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [showSessionsList, setShowSessionsList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setBatchName(batch.batchName || "");
      const sInfo = batch.scheduleInfo || "Every Saturday 6:30 PM";
      setScheduleInfo(sInfo);

      const detectedDay = detectWeekdayFromSchedule(sInfo) || "Saturday";
      setSelectedWeekday(detectedDay);

      // Extract time from schedule if possible
      const timeMatch = sInfo.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i);
      setScheduleTime(timeMatch ? timeMatch[1].toUpperCase() : "6:30 PM");

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
            sessionTime: s.sessionTime || sInfo,
            completed: Boolean(s.completed),
          }))
        );
      } else {
        setSessionsList([]);
      }
    }
  }, [batch]);

  const startDateWeekday = startDate ? getDayOfWeekFromDateString(startDate) : "";
  const isWeekdayMismatch =
    startDate && selectedWeekday && startDateWeekday.toLowerCase() !== selectedWeekday.toLowerCase();

  // Helper to re-align start date & sessions to selected weekday
  const handleSnapToWeekday = (targetDay: string) => {
    setSelectedWeekday(targetDay);
    const newSchedule = `Every ${targetDay} ${scheduleTime}`;
    setScheduleInfo(newSchedule);

    const snappedDate = getNextDateForWeekday(targetDay, startDate || undefined);
    setStartDate(snappedDate);

    if (sessionsList.length > 0) {
      setSessionsList((prev) =>
        prev.map((s, idx) => ({
          ...s,
          sessionDate: addWeeksToDateString(snappedDate, idx),
          sessionTime: newSchedule,
        }))
      );
    }
  };

  const handleWeekdayChange = (day: string) => {
    setSelectedWeekday(day);
    const updatedSchedule = `Every ${day} ${scheduleTime}`;
    setScheduleInfo(updatedSchedule);

    // Prompt or auto-adjust start date if user wants alignment
    const snapped = getNextDateForWeekday(day, startDate || undefined);
    setStartDate(snapped);

    if (syncSessionDates && sessionsList.length > 0) {
      setSessionsList((prev) =>
        prev.map((s, idx) => ({
          ...s,
          sessionDate: addWeeksToDateString(snapped, idx),
          sessionTime: updatedSchedule,
        }))
      );
    }
  };

  const handleTimeChange = (time: string) => {
    setScheduleTime(time);
    const updatedSchedule = `Every ${selectedWeekday} ${time}`;
    setScheduleInfo(updatedSchedule);
    setSessionsList((prev) =>
      prev.map((s) => ({
        ...s,
        sessionTime: updatedSchedule,
      }))
    );
  };

  // When startDate changes and syncSessionDates is ON, recalculate all session dates
  const handleStartDateChange = (newDateStr: string) => {
    setStartDate(newDateStr);
    if (newDateStr) {
      const detectedDay = getDayOfWeekFromDateString(newDateStr);
      if (detectedDay) {
        setSelectedWeekday(detectedDay);
        setScheduleInfo(`Every ${detectedDay} ${scheduleTime}`);
      }
    }

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

  const handleSessionFieldChange = (index: number, field: keyof SessionItem, val: any) => {
    setSessionsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddSession = () => {
    const nextNum = sessionsList.length + 1;
    let nextDate = "";
    if (sessionsList.length > 0 && sessionsList[sessionsList.length - 1].sessionDate) {
      nextDate = addWeeksToDateString(sessionsList[sessionsList.length - 1].sessionDate, 1);
    } else if (startDate) {
      nextDate = addWeeksToDateString(startDate, sessionsList.length);
    }

    setSessionsList((prev) => [
      ...prev,
      {
        sessionNumber: nextNum,
        title: `Session ${nextNum}`,
        sessionDate: nextDate,
        sessionTime: scheduleInfo || "6:30 PM",
        completed: false,
      },
    ]);
  };

  const handleDeleteSession = (index: number) => {
    if (!confirm(`Are you sure you want to remove Session ${sessionsList[index].sessionNumber}?`)) {
      return;
    }
    setSessionsList((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-number sessions cleanly
      return filtered.map((s, idx) => ({
        ...s,
        sessionNumber: idx + 1,
      }));
    });
  };

  const handleDeleteBatch = async () => {
    if (!batch) return;
    const confirmText = prompt(
      `⚠️ WARNING: Deleting batch "${batch.batchName}" will remove all associated sessions and enrollments.\n\nType "DELETE" to confirm:`
    );
    if (confirmText !== "DELETE") {
      return;
    }

    setDeletingBatch(true);
    try {
      const res = await fetch(`/api/courses/batches?id=${batch.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete batch");
      }
    } catch (err: any) {
      alert(err.message || "Network error deleting batch");
    } finally {
      setDeletingBatch(false);
    }
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
      const res = await fetch("/api/courses/batches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: batch.id,
          batchName: batchName.trim(),
          scheduleInfo: scheduleInfo.trim(),
          startDate: startDate || undefined,
          active,
          syncSessionDates,
          sessions: sessionsList.map((s) => ({
            id: s.id,
            sessionNumber: s.sessionNumber,
            title: s.title,
            sessionDate: s.sessionDate,
            sessionTime: s.sessionTime || scheduleInfo.trim(),
            completed: Boolean(s.completed),
          })),
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
      title="Edit &amp; Customize Batch"
      subtitle={`Configure schedule, align session dates & customize sessions for ${batch.courseTitle || "Course"}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs max-h-[82vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Batch Name */}
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

        {/* Quick Weekday & Time Chooser */}
        <div className="p-3 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-2.5">
          <label className="block font-bold text-[#08415C] uppercase text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            Schedule Routine (Day of Week &amp; Time)
          </label>

          {/* Weekday Buttons */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => {
              const isSelected = selectedWeekday.toLowerCase() === day.toLowerCase();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleWeekdayChange(day)}
                  className={`py-1.5 px-1 rounded-lg text-center font-bold text-[11px] transition ${
                    isSelected
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                  title={`Set schedule to Every ${day}`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-0.5">
                Session Time
              </label>
              <input
                type="text"
                value={scheduleTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-800 outline-none focus:border-[#08415C] font-semibold"
                placeholder="e.g. 6:30 PM"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-0.5">
                Full Schedule Description
              </label>
              <input
                type="text"
                value={scheduleInfo}
                onChange={(e) => setScheduleInfo(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-800 outline-none focus:border-[#08415C]"
                placeholder="e.g. Every Saturday 6:30 PM"
              />
            </div>
          </div>
        </div>

        {/* Start Date & Day Alignment Check */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-stone-700 uppercase">
              Start Date (Session 1) *
            </label>
            {startDate && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  isWeekdayMismatch
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}
              >
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

          {/* Weekday Mismatch Warning & Instant Auto-Fix */}
          {isWeekdayMismatch && (
            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Start Date falls on <strong>{startDateWeekday}</strong>, but schedule is set for <strong>{selectedWeekday}</strong>!
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSnapToWeekday(selectedWeekday)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 whitespace-nowrap shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Snap to next {selectedWeekday}</span>
              </button>
            </div>
          )}
        </div>

        {/* Auto-Sync Toggle */}
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
              Auto-sync all session dates to weekly intervals (7 days apart)
              <span className="block text-[11px] font-normal text-emerald-800 mt-0.5">
                Every subsequent session date will follow consecutively every 7 days from the Start Date.
              </span>
            </label>
          </div>
        </div>

        {/* Full Session Customization List (Add, Edit, Delete Sessions) */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="p-2.5 bg-[#FAF8F5] flex items-center justify-between border-b border-stone-200">
            <div className="flex items-center gap-1.5 font-bold text-stone-800">
              <Calendar className="w-3.5 h-3.5 text-[#08415C]" />
              <span>Customize Sessions ({sessionsList.length} Total)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSession}
                className="px-2 py-1 bg-[#08415C] hover:bg-[#063349] text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs"
                title="Add a new session"
              >
                <Plus className="w-3 h-3" />
                <span>Add Session</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSessionsList(!showSessionsList)}
                className="p-1 hover:bg-stone-200 rounded text-stone-600"
              >
                {showSessionsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showSessionsList && (
            <div className="p-2.5 max-h-60 overflow-y-auto space-y-2 bg-white divide-y divide-stone-100">
              {sessionsList.map((sess, idx) => (
                <div key={sess.id || idx} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 font-bold text-stone-700 flex items-center justify-center text-[10px] flex-shrink-0">
                      S{sess.sessionNumber}
                    </span>
                    <input
                      type="text"
                      value={sess.title}
                      onChange={(e) => handleSessionFieldChange(idx, "title", e.target.value)}
                      className="p-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 outline-none focus:border-[#08415C] flex-1 min-w-0"
                      placeholder={`Session ${sess.sessionNumber} Title`}
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={sess.sessionDate}
                        onChange={(e) => handleSessionFieldChange(idx, "sessionDate", e.target.value)}
                        className="p-1 border border-stone-300 rounded-lg text-[11px] font-mono outline-none focus:border-[#08415C]"
                      />
                      {sess.sessionDate && (
                        <span className="text-[10px] font-semibold text-stone-500 whitespace-nowrap bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200">
                          {getDayOfWeekFromDateString(sess.sessionDate).slice(0, 3)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition"
                      title="Delete this session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="batchActive"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-[#08415C] rounded border-stone-300"
          />
          <label htmlFor="batchActive" className="font-semibold text-stone-700 cursor-pointer">
            Active Batch (available for attendance, student enrollment &amp; calling sewa)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-between gap-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDeleteBatch}
            disabled={deletingBatch}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
            title="Permanently delete this batch"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>{deletingBatch ? "Deleting..." : "Delete Batch"}</span>
          </button>

          <div className="flex items-center gap-2">
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
        </div>
      </form>
    </Modal>
  );
}
