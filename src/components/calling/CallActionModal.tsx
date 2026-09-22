"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Phone, PhoneCall, Copy, Check, Calendar, AlertCircle } from "lucide-react";

interface CallActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    id: string;
    fullName: string;
    mobile: string;
    area?: string;
    stage?: string;
  } | null;
  onCallLogged?: () => void;
}

const OUTCOMES = [
  { value: "CONNECTED", label: "Connected", color: "border-emerald-500 text-emerald-700 bg-emerald-50" },
  { value: "YES_WILL_ATTEND", label: "Yes, Will Attend", color: "border-emerald-600 text-emerald-800 bg-emerald-100" },
  { value: "CALL_BACK", label: "Call Back Later", color: "border-blue-500 text-blue-700 bg-blue-50" },
  { value: "INTERESTED", label: "Interested", color: "border-purple-500 text-purple-700 bg-purple-50" },
  { value: "MAYBE", label: "Maybe", color: "border-amber-500 text-amber-700 bg-amber-50" },
  { value: "NO_ANSWER", label: "No Answer / Busy", color: "border-orange-500 text-orange-700 bg-orange-50" },
  { value: "NOT_INTERESTED", label: "Not Interested", color: "border-red-400 text-red-700 bg-red-50" },
  { value: "WRONG_NUMBER", label: "Wrong Number", color: "border-gray-400 text-gray-700 bg-gray-50" },
  { value: "DO_NOT_CONTACT", label: "Do Not Contact", color: "border-red-700 text-red-900 bg-red-100" },
];

export const CallActionModal: React.FC<CallActionModalProps> = ({
  isOpen,
  onClose,
  person,
  onCallLogged,
}) => {
  const [outcome, setOutcome] = useState<string>("CONNECTED");
  const [callType, setCallType] = useState<string>("Program Invitation");
  const [notes, setNotes] = useState<string>("");
  const [scheduleFollowup, setScheduleFollowup] = useState<boolean>(true);
  const [followupDate, setFollowupDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [followupPriority, setFollowupPriority] = useState<string>("MEDIUM");
  const [copied, setCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const handleCopy = () => {
    if (person?.mobile) {
      navigator.clipboard.writeText(person.mobile);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;
    setSaving(true);

    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: person.id,
          callType,
          outcome,
          notes,
          scheduleFollowup,
          followUpDate: scheduleFollowup ? followupDate : null,
          followUpPriority: followupPriority,
        }),
      });

      if (onCallLogged) onCallLogged();
      onClose();
    } catch (err) {
      console.error("Error logging call:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!person) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Call & Record Next Action"
      subtitle={`Outreach calling sewa for ${person.fullName}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {/* Click-to-Dial Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl gap-3">
          <div>
            <span className="text-xs font-semibold text-[#78909C] uppercase tracking-wider">
              Phone Number
            </span>
            <div className="text-lg font-bold text-[#08415C] flex items-center gap-2 mt-0.5">
              <span>+91 {person.mobile}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-[#78909C] hover:text-[#08415C] p-1 rounded transition"
                title="Copy Number"
              >
                {copied ? <Check className="w-4 h-4 text-[#00A896]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href={`tel:${person.mobile}`}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00A896] hover:bg-[#028090] text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Click to Dial Now</span>
          </a>
        </div>

        {/* Call Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1.5">
            Call Purpose / Category
          </label>
          <select
            value={callType}
            onChange={(e) => setCallType(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-[#E5D8B8] rounded-xl text-sm text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C]"
          >
            <option value="New Connection">New Connection Welcome</option>
            <option value="Program Invitation">Program Invitation (Bhagavad Gita Intro)</option>
            <option value="Program Reminder">Program Reminder / RSVP</option>
            <option value="Absent Student Follow-up">Course Absent Student Follow-up</option>
            <option value="Course Follow-up">Course Regularity / Materials</option>
            <option value="Relationship Call">Relationship & Well-being Check-in</option>
            <option value="Festival Greeting">Festival Greeting (Janmashtami / Gaura Purnima)</option>
            <option value="Yatra Follow-up">Yatra / Retreat Registration</option>
          </select>
        </div>

        {/* Call Outcome Options */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-2">
            Call Outcome (Mandatory)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OUTCOMES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOutcome(opt.value)}
                className={`p-2.5 rounded-xl text-xs font-medium text-left border transition flex items-center justify-between ${
                  outcome === opt.value
                    ? `${opt.color} ring-2 ring-offset-1 ring-[#08415C]`
                    : "bg-white border-[#E5D8B8] text-[#37474F] hover:bg-[#FAF8F5]"
                }`}
              >
                <span>{opt.label}</span>
                {outcome === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1.5">
            Conversation Notes & Devotee Remarks
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Traveling this week, confirmed attending Sunday session with 2 family members..."
            className="w-full p-3 bg-white border border-[#E5D8B8] rounded-xl text-sm text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C]"
          />
        </div>

        {/* Next Action / Follow-up Scheduler */}
        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5D8B8] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#08415C] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Schedule Next Action / Follow-up
            </label>
            <input
              type="checkbox"
              id="scheduleFollowup"
              checked={scheduleFollowup}
              onChange={(e) => setScheduleFollowup(e.target.checked)}
              className="w-4 h-4 text-[#08415C] rounded border-[#E5D8B8]"
            />
          </div>

          {scheduleFollowup && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[#78909C] mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-lg text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#78909C] mb-1">
                  Priority
                </label>
                <select
                  value={followupPriority}
                  onChange={(e) => setFollowupPriority(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-lg text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent (Pre-Event/Session)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5D8B8]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5D8B8] text-xs font-semibold text-[#78909C] hover:bg-[#FAF8F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold transition"
          >
            {saving ? "Saving Log..." : "Save Call & Next Action"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CallActionModal;
