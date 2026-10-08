"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Edit2, CheckCircle2, AlertCircle } from "lucide-react";

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
  } | null;
  onSuccess: () => void;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setBatchName(batch.batchName || "");
      setScheduleInfo(batch.scheduleInfo || "");
      setStartDate(
        batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : ""
      );
      setActive(batch.active !== undefined ? batch.active : true);
      setError(null);
    }
  }, [batch]);

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
          startDate: startDate ? new Date(startDate) : undefined,
          active,
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
      title="Edit Course Batch"
      subtitle={`Update details for ${batch.courseTitle || "Course"} batch`}
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
            placeholder="e.g. Gita Shiksha Course Bapunagar"
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
            placeholder="e.g. Every Sunday 6:00 PM - 7:30 PM"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 uppercase mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2.5 border border-stone-300 rounded-xl text-stone-800 outline-none focus:border-[#08415C]"
          />
        </div>

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
