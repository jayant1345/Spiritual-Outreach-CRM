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
  User as UserIcon,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOutcomeConfig } from "@/components/calling/CallActionModal";

export default function CallingSewaPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<"calling" | "calls_done" | "relationship" | "followups">("calling");
  const [toCallFilter, setToCallFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [people, setPeople] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  // Requirement: Show only the logged-in user's data by default, with option to view other users' data
  const [showOtherUsers, setShowOtherUsers] = useState<boolean>(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState("ALL");
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Reassignment modal or state
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [targetVolunteerId, setTargetVolunteerId] = useState("");

  // Initialize filter on mount & respect URL params if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const volId = params.get("volunteerId");
      const tab = params.get("tab");
      const camp = params.get("campaign") || params.get("batch");

      if (volId) {
        setSelectedVolunteer(volId);
        // If an explicit volunteer is in the URL that isn't the logged-in user, enable other users view
        if (user && volId !== user.id) {
          setShowOtherUsers(true);
        }
      } else if (user) {
        // Default to logged-in user
        setSelectedVolunteer(user.id);
        setShowOtherUsers(false);
      }

      if (camp) setSelectedCampaign(camp);
      if (tab && (tab === "calling" || tab === "calls_done" || tab === "relationship" || tab === "followups")) {
        setActiveTab(tab as any);
      }
    }
  }, [user]);

  useEffect(() => {
    // Only fetch data once selectedVolunteer has an initial value (or user is determined)
    if (selectedVolunteer || showOtherUsers || user) {
      fetchData();
    }
  }, [refreshTrigger, selectedVolunteer, selectedCampaign, activeTab, showOtherUsers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch volunteers list
      const vRes = await fetch("/api/volunteers");
      const vData = await vRes.json();
      if (Array.isArray(vData)) setVolunteers(vData);

      // Determine active volunteer filter (logged-in user by default, or selected)
      const currentVolunteerFilter = !showOtherUsers && user ? user.id : selectedVolunteer || "ALL";

      // 2. Fetch people with volunteer and campaign/batch filter
      const pParams = new URLSearchParams();
      if (currentVolunteerFilter && currentVolunteerFilter !== "ALL") {
        pParams.append("volunteerId", currentVolunteerFilter);
      }
      if (selectedCampaign !== "ALL") {
        pParams.append("batch", selectedCampaign);
      }

      const pRes = await fetch(`/api/people?${pParams.toString()}`);
      const pData = await pRes.json();
      if (Array.isArray(pData)) setPeople(pData);

      // 3. Extract unique batches & campaigns across CRM members + Course Batches
      const campSet = new Set<string>();

      try {
        const courseRes = await fetch("/api/courses");
        const courseData = await courseRes.json();
        if (Array.isArray(courseData)) {
          courseData.forEach((c: any) => {
            if (Array.isArray(c.batches)) {
              c.batches.forEach((b: any) => {
                if (b.batchName) campSet.add(b.batchName.trim());
              });
            }
          });
        }
      } catch (e) {
        console.error("Error fetching course batches for filter:", e);
      }

      const allRes = await fetch("/api/people");
      const allData = await allRes.json();
      if (Array.isArray(allData)) {
        allData.forEach((p: any) => {
          if (p.source && p.source !== "Excel Import" && p.source !== "Reference") {
            campSet.add(p.source.trim());
          }
          if (p.tags) {
            p.tags.split(",").forEach((t: string) => {
              const c = t.trim();
              if (c) campSet.add(c);
            });
          }
        });
      }
      setAvailableCampaigns(Array.from(campSet));

      // 4. Fetch followups
      const fUrl =
        currentVolunteerFilter && currentVolunteerFilter !== "ALL"
          ? `/api/followups?volunteerId=${currentVolunteerFilter}`
          : "/api/followups";
      const fRes = await fetch(fUrl);
      const fData = await fRes.json();
      if (Array.isArray(fData)) setFollowups(fData);

      // 5. Fetch calls done (call logs)
      const cUrl =
        currentVolunteerFilter && currentVolunteerFilter !== "ALL"
          ? `/api/calls?volunteerId=${currentVolunteerFilter}`
          : "/api/calls";
      const cRes = await fetch(cUrl);
      const cData = await cRes.json();
      if (Array.isArray(cData)) setCallLogs(cData);
    } catch (err) {
      console.error("Error loading calling data:", err);
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

  const activeVolunteerId = !showOtherUsers && user ? user.id : selectedVolunteer || "ALL";
  const selectedVolunteerObj = volunteers.find((v) => v.id === activeVolunteerId);

  // Helper to find latest call for each devotee in To Call list
  const getLatestCallForPerson = (person: any) => {
    if (person.callLogs && person.callLogs.length > 0) {
      return person.callLogs[0];
    }
    return callLogs.find((c) => c.personId === person.id || c.person?.id === person.id);
  };

  // Filtered devotees for To Call list
  const filteredPeople = people.filter((person) => {
    const latestCall = getLatestCallForPerson(person);
    const isCompleted = !!latestCall;
    if (toCallFilter === "PENDING") return !isCompleted;
    if (toCallFilter === "COMPLETED") return isCompleted;
    return true;
  });

  const completedCallsCount = people.filter((p) => !!getLatestCallForPerson(p)).length;
  const pendingCallsCount = people.length - completedCallsCount;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] flex items-center gap-2">
            <PhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
            Calling &amp; Devotee Care Desk
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78909C] mt-0.5">
            {!showOtherUsers
              ? `Personal calling queue for ${user?.name || "Logged-in Caller"} • Focused & Minimal View`
              : "Team view: devotee allocation, caller progress, and call logs across all volunteers"}
          </p>
        </div>

        {/* View Mode Switcher: My Data (Default) vs Other Users' Data */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {!showOtherUsers ? (
            <button
              type="button"
              onClick={() => {
                setShowOtherUsers(true);
                setSelectedVolunteer("ALL");
              }}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-[#E5D8B8] text-[#08415C] text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              title="Click to view all callers and other volunteers' data"
            >
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>View Other Users&apos; Data</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowOtherUsers(false);
                if (user) setSelectedVolunteer(user.id);
              }}
              className="px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
              title="Switch back to minimal view showing only my data"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Show Only My Data</span>
            </button>
          )}

          {/* Caller selector (Visible in Other Users view) */}
          {showOtherUsers && (
            <div className="px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs flex-1 sm:flex-initial">
              <span className="text-stone-500">Caller:</span>
              <select
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
                className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer"
              >
                <option value="ALL">All Callers</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.id === user?.id ? "(You)" : `(${v.role.replace(/_/g, " ")})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Batch / Campaign Filter */}
          <div className="px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs flex-1 sm:flex-initial">
            <span className="text-stone-500">Batch:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-transparent text-[#08415C] font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {availableCampaigns.map((camp) => (
                <option key={camp} value={camp}>
                  {camp}
                </option>
              ))}
            </select>
          </div>

          {(selectedCampaign !== "ALL" || (showOtherUsers && selectedVolunteer !== "ALL")) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCampaign("ALL");
                if (showOtherUsers) setSelectedVolunteer("ALL");
              }}
              className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* MINIMAL MODE (Default): Personal Status Strip */}
      {!showOtherUsers ? (
        <div className="p-3.5 sm:p-4 bg-white border border-[#E5D8B8] rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#08415C] text-[#D4AF37] font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "ME"}
            </div>
            <div>
              <div className="font-serif font-bold text-sm sm:text-base text-[#08415C] flex items-center gap-2">
                <span>{user?.name || "My Calling Desk"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  Logged-in User
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Displaying only your allocated devotees and recorded calls.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("calling")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border text-center transition cursor-pointer ${
                activeTab === "calling"
                  ? "bg-[#08415C] text-white border-[#08415C]"
                  : "bg-[#FAF8F5] border-[#E5D8B8] text-stone-700"
              }`}
            >
              <div className="text-xs font-bold">{people.length}</div>
              <div className="text-[10px] opacity-80">To Call</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calls_done")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border text-center transition cursor-pointer ${
                activeTab === "calls_done"
                  ? "bg-[#00A896] text-white border-[#00A896]"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="text-xs font-bold">{callLogs.length}</div>
              <div className="text-[10px] opacity-80">Calls Done</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("followups")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border text-center transition cursor-pointer ${
                activeTab === "followups"
                  ? "bg-[#08415C] text-white border-[#08415C]"
                  : "bg-[#FAF8F5] border-[#E5D8B8] text-stone-700"
              }`}
            >
              <div className="text-xs font-bold">{followups.length}</div>
              <div className="text-[10px] opacity-80">Follow-ups</div>
            </button>
          </div>
        </div>
      ) : (
        /* OTHER USERS' VIEW: Full Team Workload Distribution Summary */
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
            <span>Team Workload &amp; Caller Distribution</span>
            <span className="text-[11px] text-[#08415C]">Click on any caller card below to filter</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {volunteers.map((vol) => {
              const isSelected = activeVolunteerId === vol.id;
              const isCurrentUser = vol.id === user?.id;
              return (
                <div
                  key={vol.id}
                  className={`gold-card p-3 sm:p-4 transition shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? "ring-2 ring-[#08415C] border-[#D4AF37] bg-[#FAF5E6]/40"
                      : "hover:border-[#D4AF37]"
                  }`}
                >
                  <div
                    className="flex items-center justify-between mb-1.5 cursor-pointer"
                    onClick={() => setSelectedVolunteer(isSelected ? "ALL" : vol.id)}
                    title="Tap to filter by this caller"
                  >
                    <div className="font-serif font-bold text-xs sm:text-sm text-[#08415C] flex items-center gap-1.5 truncate">
                      <div className="w-6 h-6 rounded-full bg-[#08415C] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {vol.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <span className="truncate">{vol.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                          You
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#08415C] text-white font-bold">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-center text-xs mt-2">
                    {/* Box 1: Allocated (To Call) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVolunteer(vol.id);
                        setActiveTab("calling");
                      }}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        isSelected && activeTab === "calling"
                          ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                          : "bg-[#FAF8F5] border-[#E5D8B8] hover:border-[#08415C] text-stone-800"
                      }`}
                      title="Click to view allocated devotees to call"
                    >
                      <div
                        className={`font-bold text-xs sm:text-sm ${
                          isSelected && activeTab === "calling" ? "text-white" : "text-[#08415C]"
                        }`}
                      >
                        {vol._count?.assignedPeople || 0}
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] ${
                          isSelected && activeTab === "calling" ? "text-white/80" : "text-[#78909C]"
                        }`}
                      >
                        To Call
                      </div>
                    </button>

                    {/* Box 2: Calls Done */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVolunteer(vol.id);
                        setActiveTab("calls_done");
                      }}
                      className={`p-1.5 rounded-lg border text-center transition cursor-pointer ${
                        isSelected && activeTab === "calls_done"
                          ? "bg-[#00A896] text-white border-[#00A896] shadow-xs"
                          : "bg-emerald-50 border-emerald-200 hover:border-[#00A896] text-emerald-900"
                      }`}
                      title="Click to view completed calls done by this caller"
                    >
                      <div
                        className={`font-bold text-xs sm:text-sm ${
                          isSelected && activeTab === "calls_done" ? "text-white" : "text-[#00A896]"
                        }`}
                      >
                        {vol._count?.callLogs || 0}
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] ${
                          isSelected && activeTab === "calls_done" ? "text-white/80" : "text-[#00A896]"
                        }`}
                      >
                        Calls Done
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unified Section Navigation Tabs (To Call Queue + Calls Done + Relationship + Follow-ups) */}
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
          <span>To Call ({people.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calls_done")}
          className={`py-2 px-3.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "calls_done"
              ? "bg-[#00A896] text-white shadow-xs"
              : "bg-white text-stone-700 hover:bg-emerald-50 border border-emerald-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00A896]" />
          <span>Calls Done ({callLogs.length})</span>
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
          <span>Devotee Care &amp; Counseling</span>
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

      {/* TAB CONTENT 1: To Call / Allocated Queue */}
      {(activeTab === "calling" || activeTab === "relationship") && (
        <div className="gold-card p-3.5 sm:p-5 space-y-3.5 shadow-xs">
          {/* Section Sub-header & Filter Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 gap-2">
            <div>
              <span>
                Showing <strong>{filteredPeople.length}</strong> of <strong>{people.length}</strong> devotees to call
                {activeVolunteerId !== "ALL" && selectedVolunteerObj && (
                  <span className="font-semibold text-[#08415C]">
                    {" "}allocated to {selectedVolunteerObj.name}
                  </span>
                )}
              </span>
            </div>

            {/* Quick Status Sub-filters: All | Pending To Call | Completed Calls */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5D8B8]">
              <button
                type="button"
                onClick={() => setToCallFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  toCallFilter === "ALL"
                    ? "bg-[#08415C] text-white shadow-xs"
                    : "text-stone-600 hover:bg-white"
                }`}
              >
                All ({people.length})
              </button>

              <button
                type="button"
                onClick={() => setToCallFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  toCallFilter === "PENDING"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-amber-800 hover:bg-white"
                }`}
                title="Devotees waiting for call"
              >
                <span>To Call</span>
                <span className="font-mono text-[10px]">({pendingCallsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setToCallFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  toCallFilter === "COMPLETED"
                    ? "bg-[#00A896] text-white shadow-xs"
                    : "text-[#00A896] hover:bg-white"
                }`}
                title="Devotees where call has been completed"
              >
                <span>Completed</span>
                <span className="font-mono text-[10px]">({completedCallsCount})</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500">
                <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                <p>Loading calling queue...</p>
              </div>
            ) : filteredPeople.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-stone-700">
                  {toCallFilter === "PENDING"
                    ? "Wonderful! All assigned devotees have been called."
                    : "No devotees found in this queue."}
                </p>
                {toCallFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setToCallFilter("ALL")}
                    className="text-xs text-[#08415C] font-bold hover:underline"
                  >
                    View all devotees ({people.length})
                  </button>
                )}
              </div>
            ) : (
              filteredPeople.map((person) => {
                const latestCall = getLatestCallForPerson(person);
                const isCompleted = !!latestCall;
                const outcomeConfig = isCompleted
                  ? getOutcomeConfig(latestCall.outcome)
                  : null;

                return (
                  <div
                    key={person.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
                      isCompleted && outcomeConfig
                        ? `${outcomeConfig.cardBg} ring-1 ring-offset-0 ${
                            latestCall.outcome === "YES_WILL_ATTEND"
                              ? "ring-emerald-400/60"
                              : latestCall.outcome === "NO_WILL_NOT_ATTEND"
                              ? "ring-rose-300/60"
                              : latestCall.outcome === "CALL_NOT_PICKED"
                              ? "ring-amber-300/60"
                              : latestCall.outcome === "NOT_CONFIRMED"
                              ? "ring-purple-300/60"
                              : latestCall.outcome === "CONFIRM_LATER"
                              ? "ring-blue-300/60"
                              : "ring-emerald-300/50"
                          }`
                        : "bg-white border-[#E5D8B8] hover:border-[#D4AF37]"
                    }`}
                  >
                    {/* Left: Devotee Info & Completed Response Display */}
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => openPersonModal(person.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm sm:text-base text-[#08415C] hover:underline">
                          {person.fullName}
                        </span>

                        {/* Visual Response Badge on Completed Calls */}
                        {isCompleted && outcomeConfig ? (
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold shadow-2xs ${outcomeConfig.badgeColor}`}
                          >
                            <span>{outcomeConfig.icon}</span>
                            <span>{outcomeConfig.label}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-stone-400" />
                            <span>To Call</span>
                          </span>
                        )}

                        <Badge variant="morpankh" size="sm">{person.stage}</Badge>
                        <span className="text-xs font-mono text-stone-600 font-semibold">
                          +91 {person.mobile}
                        </span>
                        {person.area && (
                          <span className="text-[11px] text-stone-500">• {person.area}</span>
                        )}

                        {person.courseEnrollments && person.courseEnrollments.length > 0 && (
                          person.courseEnrollments.map((enr: any) => (
                            <span
                              key={enr.id}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                              title={`Enrolled in ${enr.course?.title || "Course"} (${enr.batch?.batchName || "Batch"})`}
                            >
                              <span>🎓</span>
                              <span>{enr.batch?.batchName || enr.course?.title}</span>
                            </span>
                          ))
                        )}

                        {person.tags && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            🏷️ {person.tags}
                          </span>
                        )}

                        {person.source && person.source !== "Reference" && person.source !== "Excel Import" && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            {person.source}
                          </span>
                        )}
                      </div>

                      {/* Caller Assignment, Last Call Time, and Remarks */}
                      <div className="text-[11px] text-stone-600 mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>
                          Caller: <strong>{person.assignedVolunteer?.name || "Unassigned"}</strong>
                        </span>

                        {isCompleted && latestCall?.createdAt && (
                          <span className="text-stone-500 font-mono text-[10px]">
                            • Called {new Date(latestCall.createdAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}

                        {person.notes && !latestCall?.notes && (
                          <span className="italic line-clamp-1 text-stone-500">
                            &quot;{person.notes}&quot;
                          </span>
                        )}
                      </div>

                      {/* Display Latest Call Remarks / Discussion Notes */}
                      {isCompleted && latestCall?.notes && (
                        <div className="mt-1.5 text-xs text-stone-700 bg-white/80 p-2 rounded-lg border border-stone-200/70 italic flex items-start gap-1.5 shadow-2xs">
                          <span className="font-bold not-italic text-[#08415C] text-[11px] whitespace-nowrap">
                            Remarks:
                          </span>
                          <span className="line-clamp-2">&quot;{latestCall.notes}&quot;</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Reassignment */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
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
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
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

                      {/* Call Action Button */}
                      <button
                        onClick={() => openCallModal(person)}
                        className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-white text-xs font-semibold rounded-xl sm:rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition ${
                          isCompleted
                            ? "bg-[#08415C] hover:bg-[#0B4F6C] border border-[#D4AF37]/40"
                            : "bg-[#00A896] hover:bg-[#028090]"
                        }`}
                        title={isCompleted ? "Call Again / Update Response" : "Click to Dial Devotee"}
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{isCompleted ? "Update Call" : "Call"}</span>
                      </button>

                      <button
                        onClick={() => openWhatsAppModal(person)}
                        className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl sm:rounded-lg border border-[#D4AF37]/50 shadow-xs flex items-center justify-center gap-1.5 transition"
                        title="Send WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>WhatsApp</span>
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
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Calls Done / Completed Outreach Calls History */}
      {activeTab === "calls_done" && (
        <div className="gold-card p-3.5 sm:p-5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 gap-2">
            <span>
              Showing <strong>{callLogs.length}</strong> calls completed
              {activeVolunteerId !== "ALL" && selectedVolunteerObj && (
                <span className="font-semibold text-[#08415C]">
                  {" "}logged by {selectedVolunteerObj.name}
                </span>
              )}
            </span>
            <span className="text-[11px] text-[#00A896] font-semibold">
              Historical record of all outreach calls &amp; responses
            </span>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500">
                <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                <p>Loading completed calls...</p>
              </div>
            ) : callLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-stone-300 mx-auto mb-1" />
                <p className="font-semibold text-stone-700">No completed calls logged yet for this selection.</p>
                <p className="text-[11px] text-stone-400">
                  Switch to the &quot;To Call&quot; queue and tap &quot;Call&quot; to dial devotees and record outcomes.
                </p>
              </div>
            ) : (
              callLogs.map((log) => {
                const outcomeConfig = getOutcomeConfig(log.outcome);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#00A896] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        if (log.person?.id) openPersonModal(log.person.id);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm text-[#08415C] hover:underline">
                          {log.person?.fullName || "Devotee"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${outcomeConfig.badgeColor}`}
                        >
                          <span>{outcomeConfig.icon}</span>
                          <span>{outcomeConfig.label}</span>
                        </span>
                        <span className="text-xs font-mono text-stone-600 font-semibold">
                          +91 {log.person?.mobile}
                        </span>
                        {log.person?.area && (
                          <span className="text-[11px] text-stone-500">• {log.person.area}</span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-600 mt-1.5 flex items-center gap-2.5 flex-wrap">
                        <span className="font-medium text-[#08415C]">
                          Category: <strong>{log.callType}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-stone-500">
                          Caller: <strong className="text-stone-700">{log.volunteer?.name || "Volunteer"}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-stone-400 font-mono text-[10px]">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-xs text-stone-700 bg-[#FAF8F5] p-2 rounded-lg border border-[#E5D8B8] mt-2 italic leading-relaxed">
                          &quot;{log.notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap flex-shrink-0">
                      {log.person && (
                        <>
                          <button
                            onClick={() => openCallModal(log.person)}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition"
                            title="Call Again"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> <span>Call</span>
                          </button>
                          <button
                            onClick={() => openWhatsAppModal(log.person)}
                            className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-xs flex items-center justify-center gap-1.5 transition"
                            title="Send WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => openPersonModal(log.person.id)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-[#08415C] rounded-lg transition"
                            title="Open 360° Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
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
