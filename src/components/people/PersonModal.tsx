"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";
import {
  Phone,
  MessageSquare,
  Calendar,
  BookOpen,
  User,
  MapPin,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Edit3,
  CalendarClock,
  CheckSquare,
  FileText,
  PhoneCall,
  Save,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string | null;
  onOpenCallModal: (person: any) => void;
  onOpenWhatsAppModal: (person: any) => void;
  onPersonUpdated?: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  personId,
  onOpenCallModal,
  onOpenWhatsAppModal,
  onPersonUpdated,
}) => {
  const { hasPermission } = useAuth();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Right Side Activity Actions State
  const [activeRightTab, setActiveRightTab] = useState<"log_call" | "add_task" | "add_note">("log_call");
  const [callOutcome, setCallOutcome] = useState("CONNECTED");
  const [callNotes, setCallNotes] = useState("");
  const [callNextDate, setCallNextDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskRemarks, setTaskRemarks] = useState("");
  const [taskType, setTaskType] = useState("Calling");
  const [newNote, setNewNote] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && personId) {
      fetchPersonDetails(personId);
      setIsEditing(false);
    }
  }, [isOpen, personId]);

  const fetchPersonDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${id}`);
      const data = await res.json();
      setPerson(data);
      setEditFormData({
        fullName: data.fullName,
        mobile: data.mobile,
        whatsappNumber: data.whatsappNumber || data.mobile,
        email: data.email || "",
        area: data.area || "",
        profession: data.profession || "",
        stage: data.stage || "New Member",
        notes: data.notes || "",
        japaDailyRounds: data.japaDailyRounds || 0,
        spiritualMentor: data.spiritualMentor || "",
      });
    } catch (err) {
      console.error("Error loading person details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save edits");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!personId) return;
    if (!confirm(`Are you sure you want to permanently delete ${person?.fullName} from the CRM? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/people/${personId}`, { method: "DELETE" });
      if (res.ok) {
        onClose();
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Log Call Action (Right Side Odoo-style)
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !callNotes.trim()) return;

    setActionSubmitting(true);
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          callType: "Follow-up Call",
          outcome: callOutcome,
          notes: callNotes,
          scheduleFollowup: !!callNextDate,
          followUpDate: callNextDate || null,
        }),
      });

      setCallNotes("");
      setCallNextDate("");
      fetchPersonDetails(personId);
      if (onPersonUpdated) onPersonUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Quick Add Follow-up Task Action
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !taskDueDate) return;

    setActionSubmitting(true);
    try {
      await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          dueDate: taskDueDate,
          type: taskType,
          remarks: taskRemarks,
        }),
      });

      setTaskRemarks("");
      setTaskDueDate("");
      fetchPersonDetails(personId);
      if (onPersonUpdated) onPersonUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Quick Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !newNote.trim()) return;

    setActionSubmitting(true);
    try {
      await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: person.notes ? `${person.notes}\n[${new Date().toLocaleDateString("en-IN")}]: ${newNote}` : newNote,
        }),
      });

      setNewNote("");
      fetchPersonDetails(personId);
      if (onPersonUpdated) onPersonUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setActionSubmitting(false);
    }
  };

  if (!isOpen || !personId) return null;

  const lastCall = person?.callLogs && person.callLogs.length > 0 ? person.callLogs[0] : null;
  const pendingTasks = person?.followupTasks?.filter((t: any) => t.status === "PENDING") || [];
  const nextFollowup = pendingTasks.length > 0 ? pendingTasks[0] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={person ? person.fullName : "Member Profile"}
      subtitle={person ? `360° Devotee Journey Dossier • ${person.area || "Chandkheda"}` : "Loading 360° Profile..."}
      maxWidth="5xl"
    >
      {loading || !person ? (
        <div className="py-16 text-center text-[#78909C]">
          <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
          <p className="text-xs font-semibold">Loading 360° Member Journey Dossier...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Header Card with Actions */}
          <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border border-[#E5D8B8] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#08415C] text-[#D4AF37] font-serif text-lg font-bold flex items-center justify-center border-2 border-[#D4AF37]/50 shadow-xs flex-shrink-0">
                {person.fullName.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg font-serif font-bold text-[#08415C]">
                    {person.fullName}
                  </h4>
                  <Badge variant="morpankh" size="sm">{person.stage}</Badge>
                  {person.japaDailyRounds > 0 && (
                    <Badge variant="gold" size="sm">📿 {person.japaDailyRounds} Rounds Daily</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#37474F] mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 font-mono font-medium">
                    <Phone className="w-3.5 h-3.5 text-[#00A896]" /> +91 {person.mobile}
                  </span>
                  {person.area && (
                    <span className="flex items-center gap-1 text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {person.area}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Floating Bar */}
            <div className="flex items-center gap-1.5 w-full md:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={() => onOpenCallModal(person)}
                className="px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                type="button"
                onClick={() => onOpenWhatsAppModal(person)}
                className="px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 flex items-center gap-1 transition shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp
              </button>

              {/* Edit Button (RBAC) */}
              {hasPermission("devotees:edit") && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1 ${
                    isEditing ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#08415C]" />
                  <span>{isEditing ? "Cancel Edit" : "Edit"}</span>
                </button>
              )}

              {/* Delete Button (RBAC) */}
              {hasPermission("devotees:delete") && (
                <button
                  type="button"
                  onClick={handleDeletePerson}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
                  title="Delete Member"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </button>
              )}
            </div>
          </div>

          {/* Edit Mode Inline Form */}
          {isEditing && (
            <form onSubmit={handleSaveEdit} className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-700" /> Edit Member Information
                </span>
                <span className="text-[11px] text-amber-700">Save changes to update CRM master record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Status / Stage</label>
                  <select
                    value={editFormData.stage}
                    onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="New Member">New Member</option>
                    <option value="Interested">Interested</option>
                    <option value="Registered">Registered</option>
                    <option value="Attended">Attended</option>
                    <option value="Regular">Regular</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Connected">Connected</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Profession</label>
                  <input
                    type="text"
                    value={editFormData.profession}
                    onChange={(e) => setEditFormData({ ...editFormData, profession: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Daily Japa Rounds</label>
                  <input
                    type="number"
                    min={0}
                    max={64}
                    value={editFormData.japaDailyRounds}
                    onChange={(e) => setEditFormData({ ...editFormData, japaDailyRounds: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-[#08415C] text-white rounded-lg text-xs font-bold hover:bg-[#063349] flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* 360° Two-Column Split Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT SIDE (7 Cols) – MEMBER INFORMATION & COURSES */}
            <div className="lg:col-span-7 space-y-4">
              {/* Basic Details Grid */}
              <div className="p-4 bg-white border border-[#E5D8B8] rounded-2xl space-y-3 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#08415C] border-b border-stone-100 pb-2">
                  Member Profile Dossier
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Profession</span>
                    <span className="font-semibold text-stone-800">{person.profession || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Age / Group</span>
                    <span className="font-semibold text-stone-800">{person.ageGroup || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Source / Campaign</span>
                    <span className="font-semibold text-stone-800">{person.source || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Calling Person</span>
                    <span className="font-semibold text-[#08415C]">{person.assignedVolunteer?.name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Relationship Steward</span>
                    <span className="font-semibold text-[#B8860B]">{person.relationshipVolunteer?.name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Registered Since</span>
                    <span className="font-semibold text-stone-800">{new Date(person.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                {person.notes && (
                  <div className="pt-2 border-t border-stone-100 text-xs">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Notes / Background</span>
                    <p className="text-stone-700 mt-0.5 whitespace-pre-wrap text-[11px] bg-stone-50 p-2 rounded-lg border border-stone-200">
                      {person.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Course-Wise Attendance Matrix (Docx Section 1.5) */}
              <div className="p-4 bg-white border border-[#E5D8B8] rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#08415C] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#08415C]" /> Course-Wise Attendance & Batches
                  </h5>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {person.courseEnrollments?.length || 0} Connected Courses
                  </span>
                </div>

                {person.courseEnrollments && person.courseEnrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500">
                          <th className="py-2">Course</th>
                          <th className="py-2">Registered</th>
                          <th className="py-2">Attendance</th>
                          <th className="py-2">Regular</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {person.courseEnrollments.map((enr: any) => {
                          const attendedSessions = enr.attendances?.filter((a: any) => a.attended).length || 0;
                          const totalSessions = enr.attendances?.length || 8;
                          const isRegular = enr.status === "REGULAR" || (attendedSessions / Math.max(totalSessions, 1)) >= 0.75;

                          return (
                            <tr key={enr.id} className="hover:bg-stone-50">
                              <td className="py-2.5 font-bold text-[#08415C]">
                                {enr.course?.title || "Course"}
                                {enr.batch?.batchName && (
                                  <span className="block text-[10px] text-stone-500 font-normal">
                                    {enr.batch.batchName}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold">
                                  Yes
                                </span>
                              </td>
                              <td className="py-2.5 font-mono font-semibold">
                                {attendedSessions} / {totalSessions}
                              </td>
                              <td className="py-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isRegular ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {isRegular ? "Yes" : "No"}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                                  {enr.status || "Active"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
                    No course enrollments linked yet. Enroll member from Courses & Batches module.
                  </div>
                )}
              </div>

              {/* Calling & Follow-up History */}
              <div className="p-4 bg-white border border-[#E5D8B8] rounded-2xl space-y-3 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#08415C] border-b border-stone-100 pb-2 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#00A896]" /> Calling Sewa History ({person.callLogs?.length || 0})
                </h5>

                {person.callLogs && person.callLogs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {person.callLogs.map((log: any) => (
                      <div key={log.id} className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#08415C]">
                            {log.callType} • <span className="text-emerald-700">{log.outcome.replace(/_/g, " ")}</span>
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {new Date(log.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        {log.notes && <p className="text-stone-700 text-[11px]">{log.notes}</p>}
                        <div className="text-[10px] text-[#B8860B]">
                          Called by: {log.volunteer?.name || "Volunteer"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic p-2 text-center">No previous call records.</p>
                )}
              </div>
            </div>

            {/* RIGHT SIDE (5 Cols) – ODOO-STYLE ACTIVITY MANAGEMENT & LOGS */}
            <div className="lg:col-span-5 space-y-4">
              {/* Odoo Style Activity Summary Banner */}
              <div className="p-3.5 bg-[#FAF8F5] border-2 border-[#D4AF37]/50 rounded-2xl space-y-2.5 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#08415C] flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4 text-[#D4AF37]" /> Activity Status Summary
                </h5>

                <div className="space-y-2 text-xs">
                  {/* Last Call */}
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Last Call Activity</span>
                    {lastCall ? (
                      <div className="mt-0.5">
                        <div className="font-bold text-stone-900 flex items-center justify-between">
                          <span>{lastCall.outcome.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-stone-500 font-normal">
                            {new Date(lastCall.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 line-clamp-1">{lastCall.notes || "No notes"}</p>
                        <span className="text-[10px] text-stone-500">By: {lastCall.volunteer?.name || "Volunteer"}</span>
                      </div>
                    ) : (
                      <span className="text-stone-500 italic text-[11px]">No call logged yet</span>
                    )}
                  </div>

                  {/* Next Follow-up Date */}
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Next Follow-up Task</span>
                    {nextFollowup ? (
                      <div className="mt-0.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-amber-900">{nextFollowup.type}</p>
                          <p className="text-[11px] text-stone-600">{nextFollowup.remarks || "Pending follow-up"}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Due: {new Date(nextFollowup.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-500 italic text-[11px]">No pending follow-up scheduled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Activity Action Panel (Odoo Style) */}
              <div className="p-4 bg-white border border-[#E5D8B8] rounded-2xl space-y-3 shadow-xs">
                {/* Action Tabs */}
                <div className="flex border-b border-stone-200 pb-2 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("log_call")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition ${
                      activeRightTab === "log_call" ? "bg-[#08415C] text-white shadow-xs" : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    📞 Log Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("add_task")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition ${
                      activeRightTab === "add_task" ? "bg-[#08415C] text-white shadow-xs" : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    📅 Follow-up
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("add_note")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition ${
                      activeRightTab === "add_note" ? "bg-[#08415C] text-white shadow-xs" : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    📝 Note
                  </button>
                </div>

                {/* TAB 1: Log Call Action */}
                {activeRightTab === "log_call" && (
                  <form onSubmit={handleLogCall} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Call Disposition / Outcome</label>
                      <select
                        value={callOutcome}
                        onChange={(e) => setCallOutcome(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white font-semibold"
                      >
                        <option value="CONNECTED">Connected / Had Conversation</option>
                        <option value="YES_WILL_ATTEND">Confirmed (Will Attend)</option>
                        <option value="INTERESTED">Interested / Seeking Guidance</option>
                        <option value="CALL_BACK">Call Back Requested</option>
                        <option value="NO_ANSWER">No Answer / Ringing</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">What was discussed? *</label>
                      <textarea
                        rows={2}
                        required
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        placeholder="Details of the discussion, devotee response..."
                        className="w-full p-2 border border-stone-300 rounded-lg outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Schedule Next Follow-up (Optional)</label>
                      <input
                        type="date"
                        value={callNextDate}
                        onChange={(e) => setCallNextDate(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="w-full py-2 bg-[#00A896] hover:bg-[#028090] text-white font-bold rounded-xl shadow-xs transition"
                    >
                      {actionSubmitting ? "Recording..." : "Save Call Activity"}
                    </button>
                  </form>
                )}

                {/* TAB 2: Add Follow-up Task */}
                {activeRightTab === "add_task" && (
                  <form onSubmit={handleAddTask} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Task Type</label>
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white font-semibold"
                      >
                        <option value="Calling">Follow-up Call</option>
                        <option value="WhatsApp">WhatsApp Reminder</option>
                        <option value="Course Follow-up">Course Absentee Follow-up</option>
                        <option value="Relationship Call">Counseling Session</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Task Remarks</label>
                      <input
                        type="text"
                        value={taskRemarks}
                        onChange={(e) => setTaskRemarks(e.target.value)}
                        placeholder="e.g. Inquire about BG Chapter 2 notes..."
                        className="w-full p-2 border border-stone-300 rounded-lg"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="w-full py-2 bg-[#08415C] hover:bg-[#063349] text-white font-bold rounded-xl shadow-xs transition"
                    >
                      {actionSubmitting ? "Saving..." : "Create Follow-up Task"}
                    </button>
                  </form>
                )}

                {/* TAB 3: Add Note */}
                {activeRightTab === "add_note" && (
                  <form onSubmit={handleAddNote} className="space-y-2.5 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Append Note to Profile</label>
                      <textarea
                        rows={3}
                        required
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add important notes or personal context..."
                        className="w-full p-2 border border-stone-300 rounded-lg outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionSubmitting}
                      className="w-full py-2 bg-[#08415C] hover:bg-[#063349] text-white font-bold rounded-xl shadow-xs transition"
                    >
                      {actionSubmitting ? "Adding..." : "Add Note to Dossier"}
                    </button>
                  </form>
                )}
              </div>

              {/* Activity Timeline Stream */}
              <div className="p-3.5 bg-white border border-[#E5D8B8] rounded-2xl space-y-2.5 max-h-60 overflow-y-auto">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">
                  Chronological Activity Stream
                </span>
                <div className="space-y-2 text-xs">
                  {person.timelineEvents && person.timelineEvents.map((evt: any) => (
                    <div key={evt.id} className="p-2 bg-[#FAF8F5] border border-stone-200 rounded-lg">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="font-bold text-[#08415C]">{evt.title}</span>
                        <span>{new Date(evt.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      {evt.description && <p className="text-stone-700 mt-0.5 text-[11px]">{evt.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PersonModal;
