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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Plus,
} from "lucide-react";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string | null;
  onOpenCallModal: (person: any) => void;
  onOpenWhatsAppModal: (person: any) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  personId,
  onOpenCallModal,
  onOpenWhatsAppModal,
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "courses" | "programs" | "japa" | "notes">("timeline");
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>("");
  const [newJapaRounds, setNewJapaRounds] = useState<number>(4);

  useEffect(() => {
    if (isOpen && personId) {
      fetchPersonDetails(personId);
    }
  }, [isOpen, personId]);

  const fetchPersonDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${id}`);
      const data = await res.json();
      setPerson(data);
    } catch (err) {
      console.error("Error loading person details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !personId) return;

    try {
      await fetch(`/api/people/${personId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      setNewNote("");
      fetchPersonDetails(personId);
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  const handleSaveJapa = async () => {
    if (!personId) return;
    try {
      await fetch("/api/japa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, rounds: newJapaRounds }),
      });
      fetchPersonDetails(personId);
    } catch (err) {
      console.error("Error logging japa:", err);
    }
  };

  if (!isOpen || !personId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={person ? person.fullName : "Devotee Profile"}
      subtitle={person ? `${person.profession || "Devotee"} • ${person.area || "Chandkheda"}` : "Loading 360° Profile..."}
      maxWidth="4xl"
    >
      {loading || !person ? (
        <div className="py-16 text-center text-[#78909C]">
          <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
          <p className="text-xs font-semibold">Loading 360° Devotee Journey Dossier...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Devotee Header Dossier */}
          <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#08415C] text-[#D4AF37] font-serif text-xl font-bold flex items-center justify-center border-2 border-[#D4AF37]/50 shadow-sm p-3">
                {person.fullName.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xl font-serif font-bold text-[#08415C]">
                    {person.fullName}
                  </h4>
                  <Badge variant="morpankh">{person.stage}</Badge>
                  {person.japaDailyRounds > 0 && (
                    <Badge variant="gold">📿 {person.japaDailyRounds} Rounds Daily</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#37474F] mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#00A896]" /> +91 {person.mobile}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {person.area || "Chandkheda"}
                  </span>
                  <span className="text-[#78909C]">
                    Source: {person.source}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Floating Bar */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <button
                type="button"
                onClick={() => onOpenCallModal(person)}
                className="px-3.5 py-2 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button
                type="button"
                onClick={() => onOpenWhatsAppModal(person)}
                className="px-3.5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-[#FFFFFF] text-xs font-semibold rounded-xl border border-[#D4AF37]/50 flex items-center gap-1.5 transition shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp
              </button>
            </div>
          </div>

          {/* Volunteer Lineage Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-[#E5D8B8] rounded-xl flex items-center justify-between">
              <span className="text-[#78909C]">Assigned Calling Sewak:</span>
              <span className="font-semibold text-[#08415C]">
                {person.assignedVolunteer?.name || "Unassigned"}
              </span>
            </div>
            <div className="p-3 bg-white border border-[#E5D8B8] rounded-xl flex items-center justify-between">
              <span className="text-[#78909C]">Relationship Steward:</span>
              <span className="font-semibold text-[#B8860B]">
                {person.relationshipVolunteer?.name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5D8B8] pb-1 overflow-x-auto">
            {[
              { id: "timeline", label: "360° Interaction Timeline", count: person.timelineEvents?.length || 0 },
              { id: "courses", label: "Courses & Sessions", count: person.courseEnrollments?.length || 0 },
              { id: "programs", label: "Programs & RSVPs", count: person.programParticipations?.length || 0 },
              { id: "japa", label: "Sadhana & Japa", count: person.japaLogs?.length || 0 },
              { id: "notes", label: "Notes & Family Details" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#08415C] text-white border border-[#D4AF37]/40 shadow-sm"
                    : "text-[#37474F] hover:bg-[#FAF8F5]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id ? "bg-[#D4AF37] text-[#08415C]" : "bg-[#F5F1EB] text-[#78909C]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: 360 Timeline */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-[#08415C]">
                  Chronological Journey Feed
                </h5>
                <span className="text-xs text-[#78909C]">
                  Showing {person.timelineEvents?.length || 0} lifetime interactions
                </span>
              </div>

              {person.timelineEvents && person.timelineEvents.length > 0 ? (
                <div className="relative pl-6 space-y-4 border-l-2 border-[#E5D8B8] ml-2">
                  {person.timelineEvents.map((event: any) => (
                    <div key={event.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#FFFFFF] border-2 border-[#D4AF37] flex items-center justify-center text-[8px] text-[#08415C]">
                        ●
                      </div>
                      <div className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl shadow-sm hover:border-[#D4AF37] transition">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#08415C] flex items-center gap-1.5">
                            <Badge variant="morpankh" size="sm">{event.eventType}</Badge>
                            {event.title}
                          </span>
                          <span className="text-[11px] text-[#78909C]">
                            {new Date(event.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-[#37474F] mt-1 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                        {event.createdByUser && (
                          <span className="inline-block text-[10px] text-[#B8860B] mt-1.5">
                            Logged by: {event.createdByUser.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#78909C] bg-[#FAF8F5] rounded-xl border border-[#E5D8B8]">
                  No interactions logged yet. Use Call or WhatsApp actions above to start the journey!
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Courses & Attendance */}
          {activeTab === "courses" && (
            <div className="space-y-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-[#08415C]">
                Course Enrollments & Multi-Session Attendance
              </h5>

              {person.courseEnrollments && person.courseEnrollments.length > 0 ? (
                person.courseEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-4 bg-white border border-[#E5D8B8] rounded-xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h6 className="font-serif font-bold text-base text-[#08415C]">
                          {enrollment.course.title}
                        </h6>
                        <p className="text-xs text-[#78909C]">
                          Batch: {enrollment.batch?.batchName} • Faculty: {enrollment.course.facultyName}
                        </p>
                      </div>
                      <Badge variant={enrollment.status === "REGULAR" ? "emerald" : "amber"}>
                        {enrollment.status} ({enrollment.attendancePercent}%)
                      </Badge>
                    </div>

                    {/* Session-by-Session Chips */}
                    <div className="space-y-1.5 pt-2 border-t border-[#E5D8B8]/60">
                      <span className="text-[11px] font-semibold text-[#78909C]">
                        Session Attendance Records:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        {enrollment.attendances && enrollment.attendances.map((att: any) => (
                          <div
                            key={att.id}
                            className={`p-2 rounded-lg text-xs border text-center ${
                              att.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            <div className="text-[10px] text-gray-500">Session {att.session?.sessionNumber}</div>
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              {att.status === "PRESENT" ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-500" />}
                              <span>{att.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#78909C] bg-[#FAF8F5] rounded-xl border border-[#E5D8B8]">
                  Devotee has not enrolled in any structured multi-session courses yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Programs & RSVPs */}
          {activeTab === "programs" && (
            <div className="space-y-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-[#08415C]">
                One-Time Programs & Event Participation
              </h5>
              {person.programParticipations && person.programParticipations.length > 0 ? (
                <div className="space-y-2.5">
                  {person.programParticipations.map((part: any) => (
                    <div key={part.id} className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#08415C] text-sm">
                          {part.program?.title}
                        </div>
                        <div className="text-[#78909C] mt-0.5">
                          Date: {new Date(part.program?.eventDate).toLocaleDateString("en-IN")} • Guests: {part.guestsCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">RSVP: {part.invitationStatus}</Badge>
                        <Badge variant={part.attendanceStatus === "ATTENDED" ? "emerald" : "neutral"}>
                          {part.attendanceStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#78909C] bg-[#FAF8F5] rounded-xl border border-[#E5D8B8]">
                  No program records found.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Sadhana & Japa */}
          {activeTab === "japa" && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h6 className="font-serif font-bold text-base text-[#08415C] flex items-center gap-2">
                    <span className="text-[#D4AF37]">📿</span> Daily Chanting Sadhana Tracker
                  </h6>
                  <p className="text-xs text-[#78909C] mt-0.5">
                    Voluntary Japa practice record for spiritual encouragement
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={64}
                    value={newJapaRounds}
                    onChange={(e) => setNewJapaRounds(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 bg-white border border-[#E5D8B8] rounded-lg text-sm text-center font-bold text-[#08415C]"
                  />
                  <span className="text-xs font-semibold text-[#37474F]">Rounds</span>
                  <button
                    type="button"
                    onClick={handleSaveJapa}
                    className="px-3.5 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm"
                  >
                    Update Japa
                  </button>
                </div>
              </div>

              {/* Japa Logs Feed */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#08415C] uppercase tracking-wider">
                  Recent Chanting Logs
                </span>
                {person.japaLogs && person.japaLogs.length > 0 ? (
                  person.japaLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-white border border-[#E5D8B8] rounded-xl flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#08415C]">
                        📿 {log.rounds} Rounds Chanted
                      </span>
                      <span className="text-[#78909C]">
                        {new Date(log.date).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#78909C] italic">No prior Japa logs recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Notes */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C]">
                  Add Relationship Note or Family Update
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record devotee spiritual interests, seva readiness, family health..."
                  className="w-full p-3 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#08415C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-sm"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              <div className="p-4 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-2 text-xs">
                <span className="font-semibold text-[#08415C]">Existing Master Profile Notes:</span>
                <p className="text-[#37474F] whitespace-pre-wrap">{person.notes || "No notes added."}</p>
                <div className="pt-2 border-t border-[#E5D8B8] text-[11px] text-[#78909C]">
                  Address: {person.address || "Not specified"} • Mentorship: {person.spiritualMentor || "General"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PersonModal;
