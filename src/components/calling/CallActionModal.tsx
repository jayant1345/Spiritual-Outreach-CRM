"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { PhoneCall, Copy, Check, Calendar, AlertCircle } from "lucide-react";

export interface CallOutcomeConfig {
  value: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  activeColor: string;
  badgeColor: string;
  cardBg: string;
}

export const CALL_OUTCOME_OPTIONS: CallOutcomeConfig[] = [
  {
    value: "YES_WILL_ATTEND",
    label: "Yes, Will Attend",
    icon: "✓",
    description: "Devotee confirmed attendance for program / session",
    color: "border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100",
    activeColor: "bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500 ring-offset-1 shadow-xs",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300",
    cardBg: "bg-emerald-50/70 border-emerald-300",
  },
  {
    value: "NO_WILL_NOT_ATTEND",
    label: "No, Will Not Attend",
    icon: "✗",
    description: "Devotee unable to attend or politely declined",
    color: "border-rose-300 text-rose-800 bg-rose-50/70 hover:bg-rose-100",
    activeColor: "bg-rose-600 text-white border-rose-700 ring-2 ring-rose-500 ring-offset-1 shadow-xs",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-300",
    cardBg: "bg-rose-50/70 border-rose-300",
  },
  {
    value: "CALL_NOT_PICKED",
    label: "Call Not Picked",
    icon: "📞",
    description: "No answer, busy, ringing, or unreachable",
    color: "border-amber-300 text-amber-800 bg-amber-50/70 hover:bg-amber-100",
    activeColor: "bg-amber-600 text-white border-amber-700 ring-2 ring-amber-500 ring-offset-1 shadow-xs",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-300",
    cardBg: "bg-amber-50/70 border-amber-300",
  },
  {
    value: "NOT_CONFIRMED",
    label: "Not Confirmed",
    icon: "❓",
    description: "Uncertain schedule, tentative, or undecided",
    color: "border-purple-300 text-purple-800 bg-purple-50/70 hover:bg-purple-100",
    activeColor: "bg-purple-600 text-white border-purple-700 ring-2 ring-purple-500 ring-offset-1 shadow-xs",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-300",
    cardBg: "bg-purple-50/70 border-purple-300",
  },
  {
    value: "CONFIRM_LATER",
    label: "Confirm Later",
    icon: "⏰",
    description: "Devotee asked to call back or will confirm later",
    color: "border-blue-300 text-blue-800 bg-blue-50/70 hover:bg-blue-100",
    activeColor: "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 ring-offset-1 shadow-xs",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-300",
    cardBg: "bg-blue-50/70 border-blue-300",
  },
];

export const getOutcomeConfig = (outcome: string) => {
  const found = CALL_OUTCOME_OPTIONS.find((o) => o.value === outcome);
  if (found) return found;

  // Fallback for legacy database entries
  switch (outcome) {
    case "CONNECTED":
    case "INTERESTED":
      return {
        value: outcome,
        label: outcome === "CONNECTED" ? "Connected" : "Interested",
        icon: "✓",
        description: "Legacy outcome",
        color: "border-emerald-300 text-emerald-800 bg-emerald-50",
        activeColor: "bg-emerald-600 text-white border-emerald-700",
        badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300",
        cardBg: "bg-emerald-50/70 border-emerald-300",
      };
    case "CALL_BACK":
    case "MAYBE":
      return {
        value: outcome,
        label: outcome === "CALL_BACK" ? "Call Back" : "Maybe",
        icon: "⏰",
        description: "Legacy outcome",
        color: "border-blue-300 text-blue-800 bg-blue-50",
        activeColor: "bg-blue-600 text-white border-blue-700",
        badgeColor: "bg-blue-50 text-blue-800 border-blue-300",
        cardBg: "bg-blue-50/70 border-blue-300",
      };
    case "NO_ANSWER":
      return {
        value: outcome,
        label: "No Answer",
        icon: "📞",
        description: "Legacy outcome",
        color: "border-amber-300 text-amber-800 bg-amber-50",
        activeColor: "bg-amber-600 text-white border-amber-700",
        badgeColor: "bg-amber-50 text-amber-800 border-amber-300",
        cardBg: "bg-amber-50/70 border-amber-300",
      };
    case "NOT_INTERESTED":
    case "WRONG_NUMBER":
    case "DO_NOT_CONTACT":
      return {
        value: outcome,
        label: outcome.replace(/_/g, " "),
        icon: "✗",
        description: "Legacy outcome",
        color: "border-rose-300 text-rose-800 bg-rose-50",
        activeColor: "bg-rose-600 text-white border-rose-700",
        badgeColor: "bg-rose-50 text-rose-800 border-rose-300",
        cardBg: "bg-rose-50/70 border-rose-300",
      };
    default:
      return {
        value: outcome || "COMPLETED",
        label: outcome ? outcome.replace(/_/g, " ") : "Completed",
        icon: "✓",
        description: "",
        color: "border-stone-300 text-stone-800 bg-stone-50",
        activeColor: "bg-stone-700 text-white",
        badgeColor: "bg-stone-100 text-stone-800 border-stone-300",
        cardBg: "bg-[#FAF8F5] border-[#E5D8B8]",
      };
  }
};

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

export const CallActionModal: React.FC<CallActionModalProps> = ({
  isOpen,
  onClose,
  person,
  onCallLogged,
}) => {
  // Bug fix: Always start fresh with empty response and empty remarks
  const [outcome, setOutcome] = useState<string>("");
  const [callType, setCallType] = useState<string>("Program Invitation");
  const [notes, setNotes] = useState<string>("");
  // Follow-up section: Unchecked by default
  const [scheduleFollowup, setScheduleFollowup] = useState<boolean>(false);
  const [followupDate, setFollowupDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [followupPriority, setFollowupPriority] = useState<string>("MEDIUM");
  const [copied, setCopied] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Guarantee that every time modal opens or a different person is selected, state is freshly initialized
  useEffect(() => {
    if (isOpen) {
      setOutcome("");
      setNotes("");
      setScheduleFollowup(false);
      setFollowupDate(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      );
      setFollowupPriority("MEDIUM");
      setCopied(false);
      setValidationError(null);
    }
  }, [isOpen, person?.id]);

  const handleCopy = () => {
    if (person?.mobile) {
      navigator.clipboard.writeText(person.mobile);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOutcome("");
    setNotes("");
    setScheduleFollowup(false);
    setValidationError(null);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    if (!outcome) {
      setValidationError("Please select one of the response options below before saving.");
      return;
    }

    setSaving(true);
    setValidationError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: person.id,
          callType,
          outcome,
          notes: notes.trim(),
          scheduleFollowup,
          followUpDate: scheduleFollowup ? followupDate : null,
          followUpPriority: scheduleFollowup ? followupPriority : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to log call");
      }

      // Reset values completely so next call starts entirely fresh
      setOutcome("");
      setNotes("");
      setScheduleFollowup(false);

      if (onCallLogged) onCallLogged();
      onClose();
    } catch (err: any) {
      console.error("Error logging call:", err);
      setValidationError(err.message || "Failed to save call log.");
    } finally {
      setSaving(false);
    }
  };

  if (!person) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            className="w-full sm:w-auto px-5 py-2.5 bg-[#00A896] hover:bg-[#028090] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
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
            <option value="Program Invitation">Program Invitation (Bhagavad Gita Intro)</option>
            <option value="Program Reminder">Program Reminder / RSVP</option>
            <option value="New Connection">New Connection Welcome</option>
            <option value="Absent Student Follow-up">Course Absent Student Follow-up</option>
            <option value="Course Follow-up">Course Regularity / Materials</option>
            <option value="Relationship Call">Relationship & Well-being Check-in</option>
            <option value="Festival Greeting">Festival Greeting (Janmashtami / Gaura Purnima)</option>
            <option value="Yatra Follow-up">Yatra / Retreat Registration</option>
          </select>
        </div>

        {/* Call Response Options (Exactly the 5 specified options) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C]">
              Call Response (Mandatory)
            </label>
            {!outcome && (
              <span className="text-[11px] text-amber-600 font-medium animate-pulse">
                * Please select response
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CALL_OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setOutcome(opt.value);
                    setValidationError(null);
                  }}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? opt.activeColor
                      : `${opt.color} hover:border-[#08415C]/40 hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? "text-white/90" : "text-stone-500"}`}>
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>

          {validationError && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Remarks Section */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1.5">
            Conversation Notes & Devotee Remarks
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Confirmed attending with spouse, traveling this week, requested Sunday morning slot..."
            className="w-full p-3 bg-white border border-[#E5D8B8] rounded-xl text-sm text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C]"
          />
        </div>

        {/* Schedule Next Action / Follow-up Section (Unchecked by default) */}
        <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5D8B8] space-y-3">
          <div className="flex items-center justify-between cursor-pointer">
            <label
              htmlFor="scheduleFollowup"
              className="text-xs font-semibold uppercase tracking-wider text-[#08415C] flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Schedule Next Action / Follow-up
            </label>
            <input
              type="checkbox"
              id="scheduleFollowup"
              checked={scheduleFollowup}
              onChange={(e) => setScheduleFollowup(e.target.checked)}
              className="w-4 h-4 text-[#08415C] rounded border-[#E5D8B8] cursor-pointer focus:ring-[#08415C]"
            />
          </div>

          <p className="text-[11px] text-[#78909C]">
            {scheduleFollowup
              ? "Follow-up will be scheduled on the date selected below."
              : "Unchecked by default. Tick the checkbox only if a future follow-up task is required."}
          </p>

          {scheduleFollowup && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5D8B8]/60 animate-in fade-in duration-200">
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
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-[#E5D8B8] text-xs font-semibold text-[#78909C] hover:bg-[#FAF8F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold transition"
          >
            {saving ? "Saving Log..." : "Save Call Response"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CallActionModal;
