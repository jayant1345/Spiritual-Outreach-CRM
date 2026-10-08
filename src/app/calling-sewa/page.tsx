"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  PhoneCall,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Calendar,
  AlertCircle,
  HeartHandshake,
  UserCheck,
  CheckSquare,
  Phone,
  Eye,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CallingSewaPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<"calling" | "relationship" | "followups">("calling");
  const [people, setPeople] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Reassignment modal or state
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [targetVolunteerId, setTargetVolunteerId] = useState("");

  useEffect(() => {
    fetchData();
  }, [refreshTrigger, selectedVolunteer, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch volunteers list
      const vRes = await fetch("/api/volunteers");
      const vData = await vRes.json();
      if (Array.isArray(vData)) setVolunteers(vData);

      // 2. Fetch people
      const pUrl = selectedVolunteer !== "ALL" ? `/api/people?volunteerId=${selectedVolunteer}` : "/api/people";
      const pRes = await fetch(pUrl);
      const pData = await pRes.json();
      if (Array.isArray(pData)) setPeople(pData);

      // 3. Fetch followups
      const fUrl = selectedVolunteer !== "ALL" ? `/api/followups?volunteerId=${selectedVolunteer}` : "/api/followups";
      const fRes = await fetch(fUrl);
      const fData = await fRes.json();
      if (Array.isArray(fData)) setFollowups(fData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (personId: string, newVolunteerId: string) => {
    try {
      await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedVolunteerId: newVolunteerId }),
      });
      setReassigningId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkFollowupComplete = async (taskId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] flex items-center gap-2">
            <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
            Calling, Devotee Care & Follow-up Desk
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78909C] mt-0.5">
            Unified workspace for tele-calling, relationship care, task reminders, and volunteer workload allocation
          </p>
        </div>

        {/* Volunteer Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs w-full sm:w-auto">
            <span className="text-stone-500">Filter by Caller:</span>
            <select
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
              className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer flex-1"
            >
              <option value="ALL">All Volunteer Queues</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.role.replace(/_/g, " ")})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Volunteer Workload Distribution Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {volunteers.map((vol) => (
          <div
            key={vol.id}
            onClick={() => setSelectedVolunteer(selectedVolunteer === vol.id ? "ALL" : vol.id)}
            className={`gold-card p-3 sm:p-4 cursor-pointer transition shadow-xs ${
              selectedVolunteer === vol.id
                ? "ring-2 ring-[#08415C] border-[#D4AF37] bg-[#FAF5E6]/40"
                : "hover:border-[#D4AF37]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="font-serif font-bold text-xs sm:text-sm text-[#08415C] flex items-center gap-1.5 truncate">
                <div className="w-6 h-6 rounded-full bg-[#08415C] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {vol.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <span className="truncate">{vol.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-center text-xs mt-2">
              <div className="p-1.5 bg-[#FAF8F5] rounded-lg border border-[#E5D8B8]">
                <div className="font-bold text-[#08415C] text-xs sm:text-sm">{vol._count?.assignedPeople || 0}</div>
                <div className="text-[9px] sm:text-[10px] text-[#78909C]">Allocated</div>
              </div>
              <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="font-bold text-[#00A896] text-xs sm:text-sm">{vol._count?.callLogs || 0}</div>
                <div className="text-[9px] sm:text-[10px] text-[#00A896]">Calls Done</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Section Navigation Tabs (Calling + Relationship + Follow-ups) */}
      <div className="flex border-b border-[#E5D8B8] pb-1 gap-2 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("calling")}
          className={`py-2 px-3.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "calling"
              ? "bg-[#08415C] text-white shadow-xs"
              : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Calling Desk ({people.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("relationship")}
          className={`py-2 px-3.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "relationship"
              ? "bg-[#08415C] text-white shadow-xs"
              : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Devotee Care & Counseling</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("followups")}
          className={`py-2 px-3.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "followups"
              ? "bg-[#08415C] text-white shadow-xs"
              : "bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Follow-up Reminders ({followups.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1 & 2: Calling Queue & Relationship List */}
      {(activeTab === "calling" || activeTab === "relationship") && (
        <div className="gold-card p-3.5 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
            <span>
              Showing <strong>{people.length}</strong> devotees in queue
            </span>
            <span className="text-[11px] text-[#08415C] font-semibold hidden sm:inline">
              Tap Call or WhatsApp to open zero-cost instant communication
            </span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500">
                <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                <p>Loading calling queue...</p>
              </div>
            ) : people.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No devotees found in this queue.
              </div>
            ) : (
              people.map((person) => (
                <div
                  key={person.id}
                  className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#D4AF37] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div
                    className="cursor-pointer flex-1 min-w-0"
                    onClick={() => openPersonModal(person.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-sm text-[#08415C] hover:underline">
                        {person.fullName}
                      </span>
                      <Badge variant="morpankh" size="sm">{person.stage}</Badge>
                      <span className="text-xs font-mono text-stone-600 font-semibold">+91 {person.mobile}</span>
                      {person.area && <span className="text-[11px] text-stone-500">• {person.area}</span>}
                    </div>

                    <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-3 flex-wrap">
                      <span>Caller: <strong>{person.assignedVolunteer?.name || "Unassigned"}</strong></span>
                      {person.notes && <span className="italic line-clamp-1">"{person.notes}"</span>}
                    </div>
                  </div>

                  {/* Actions & Reassignment */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {/* Option to reassign to other volunteers (Docx requirement 4) */}
                    {hasPermission("calling:assign") && (
                      reassigningId === person.id ? (
                        <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
                          <select
                            value={targetVolunteerId}
                            onChange={(e) => setTargetVolunteerId(e.target.value)}
                            className="text-[11px] p-1 border rounded bg-white outline-none"
                          >
                            <option value="">Select Volunteer...</option>
                            {volunteers.map((v) => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={!targetVolunteerId}
                            onClick={() => handleReassign(person.id, targetVolunteerId)}
                            className="px-2 py-1 bg-[#08415C] text-white text-[10px] font-bold rounded"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setReassigningId(null)}
                            className="px-1.5 py-1 text-stone-500 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReassigningId(person.id)}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold rounded-lg transition"
                          title="Assign to another volunteer"
                        >
                          Reassign
                        </button>
                      )
                    )}

                    <button
                      onClick={() => openCallModal(person)}
                      className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-xl sm:rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition"
                      title="Click to Dial"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> <span>Call</span>
                    </button>
                    <button
                      onClick={() => openWhatsAppModal(person)}
                      className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl sm:rounded-lg border border-[#D4AF37]/50 shadow-xs flex items-center justify-center gap-1.5 transition"
                      title="Send WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => openPersonModal(person.id)}
                      className="p-1.5 bg-stone-100 hover:bg-stone-200 text-[#08415C] rounded-lg transition"
                      title="Open 360° Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Merged Follow-up Tasks */}
      {activeTab === "followups" && (
        <div className="gold-card p-3.5 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
            <span>
              Showing <strong>{followups.length}</strong> active follow-up tasks
            </span>
          </div>

          <div className="space-y-2.5">
            {followups.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No pending follow-up tasks. All clear!
              </div>
            ) : (
              followups.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-[#D4AF37] transition"
                >
                  <div
                    className="cursor-pointer flex-1 min-w-0"
                    onClick={() => {
                      if (task.person?.id) openPersonModal(task.person.id);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#08415C]">
                        {task.type} with {task.person?.fullName || "Member"}
                      </span>
                      <span className="text-xs font-mono text-stone-600">+91 {task.person?.mobile}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        Due: {new Date(task.dueDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {task.remarks && <p className="text-xs text-stone-600 mt-1">{task.remarks}</p>}
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      Assigned to: {task.volunteer?.name || "Volunteer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {task.person && (
                      <button
                        onClick={() => openCallModal(task.person)}
                        className="px-2.5 py-1.5 bg-[#00A896] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </button>
                    )}
                    <button
                      onClick={() => handleMarkFollowupComplete(task.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
