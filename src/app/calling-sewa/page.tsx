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
  UserX,
  CheckSquare,
  Phone,
  Eye,
  Filter,
  User as UserIcon,
  Layers,
  Search,
  MoreVertical,
  MapPin,
  X,
  ChevronDown,
  Share2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOutcomeConfig } from "@/components/calling/CallActionModal";
import AssignMultipleModal from "@/components/calling/AssignMultipleModal";

const AVATAR_PALETTES = [
  { bg: "bg-[#FCE7F3]", text: "text-[#BE185D]" }, // Rose/Pink (like BJ)
  { bg: "bg-[#D1FAE5]", text: "text-[#047857]" }, // Mint/Green (like HS)
  { bg: "bg-[#DBEAFE]", text: "text-[#1D4ED8]" }, // Blue (like HP)
  { bg: "bg-[#FEF3C7]", text: "text-[#B45309]" }, // Amber/Yellow (like AJ)
  { bg: "bg-[#F3E8FF]", text: "text-[#7E22CE]" }, // Purple (like HB)
  { bg: "bg-[#FFE4E6]", text: "text-[#E11D48]" }, // Rose (like HM)
  { bg: "bg-[#CCFBF1]", text: "text-[#0F766E]" }, // Teal
  { bg: "bg-[#FFEDD5]", text: "text-[#C2410C]" }, // Orange
];

const getInitials = (name: string) => {
  if (!name) return "DV";
  const cleaned = name.replace(/^(HG|HH|Prabhu|Mataji)\s+/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].substring(0, 2).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

const getPersonPhoto = (person: any): string | null => {
  if (person.photoUrl) return person.photoUrl;
  if (person.customData) {
    try {
      const parsed = typeof person.customData === "string" ? JSON.parse(person.customData) : person.customData;
      return parsed.photoUrl || parsed.photo || null;
    } catch {
      return null;
    }
  }
  return null;
};

export default function CallingSewaPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const { user, hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<"calling" | "calls_done" | "relationship" | "followups">("calling");
  const [toCallFilter, setToCallFilter] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED" | "PENDING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("name-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [menuPersonId, setMenuPersonId] = useState<string | null>(null);

  const [people, setPeople] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  // Multi-select for assigning calls
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignMultipleOpen, setIsAssignMultipleOpen] = useState(false);

  // Requirement: Show only the logged-in user's data by default, with option to view other users' data
  const [showOtherUsers, setShowOtherUsers] = useState<boolean>(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState("ALL");
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Reassignment modal or state
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [targetVolunteerId, setTargetVolunteerId] = useState("");

  // WhatsApp Calling Report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

  // Helper to format outcome label into clean short status for WhatsApp report
  const formatReportOutcome = (outcome?: string) => {
    if (!outcome) return "Pending / Not Called";
    switch (outcome) {
      case "YES_WILL_ATTEND":
        return "yes";
      case "NO_WILL_NOT_ATTEND":
      case "NOT_INTERESTED":
      case "DO_NOT_CONTACT":
        return "can't come";
      case "CALL_NOT_PICKED":
      case "NO_ANSWER":
        return "not recieve";
      case "CONFIRM_LATER":
      case "CALL_BACK":
        return "call back later";
      case "NOT_CONFIRMED":
      case "MAYBE":
        return "not confirmed";
      default:
        return outcome.toLowerCase().replace(/_/g, " ");
    }
  };

  const generateReportText = () => {
    const listToReport = filteredPeople.length > 0 ? filteredPeople : people;
    const batchTitle = selectedCampaign !== "ALL" ? selectedCampaign : "Calling Sewa";
    const callerName = selectedVolunteerObj?.name || user?.name || "Caller";
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    let lines = [`*Calling Report - ${batchTitle} (${dateStr})*`];
    lines.push(`Caller: ${callerName}`);
    lines.push("");

    let yesCount = 0;
    let notPickedCount = 0;
    let noCount = 0;
    let otherCount = 0;

    listToReport.forEach((p) => {
      const call = getLatestCallForPerson(p);
      const outcome = call?.outcome;
      const statusText = formatReportOutcome(outcome);
      lines.push(`${p.fullName} : ${statusText}`);

      if (outcome === "YES_WILL_ATTEND") yesCount++;
      else if (outcome === "CALL_NOT_PICKED" || outcome === "NO_ANSWER") notPickedCount++;
      else if (outcome === "NO_WILL_NOT_ATTEND" || outcome === "NOT_INTERESTED") noCount++;
      else if (outcome) otherCount++;
    });

    lines.push("");
    lines.push(`*Summary:*`);
    lines.push(`Total Devotees: ${listToReport.length}`);
    lines.push(`✅ Yes (Attending): ${yesCount}`);
    lines.push(`📞 Not Received: ${notPickedCount}`);
    lines.push(`❌ Can't Come: ${noCount}`);
    if (otherCount > 0) lines.push(`⏰ Callback / Tentative: ${otherCount}`);

    return lines.join("\n");
  };

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

  // Filtered & sorted devotees for To Call list
  const filteredPeople = people
    .filter((person) => {
      const isAssigned = !!person.assignedVolunteerId || !!person.assignedVolunteer;
      const latestCall = getLatestCallForPerson(person);
      const isCompleted = !!latestCall;

      if (toCallFilter === "ASSIGNED") return isAssigned;
      if (toCallFilter === "UNASSIGNED") return !isAssigned;
      if (toCallFilter === "PENDING") return !isCompleted;
      if (toCallFilter === "COMPLETED") return isCompleted;
      return true;
    })
    .filter((person) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = person.fullName?.toLowerCase().includes(q);
      const phoneMatch = person.mobile?.includes(q);
      const areaMatch = person.area?.toLowerCase().includes(q);
      const tagMatch = person.tags?.toLowerCase().includes(q);
      const callerMatch = person.assignedVolunteer?.name?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || areaMatch || tagMatch || callerMatch;
    })
    .sort((a, b) => {
      if (sortOption === "name-asc") {
        return (a.fullName || "").localeCompare(b.fullName || "");
      }
      if (sortOption === "name-desc") {
        return (b.fullName || "").localeCompare(a.fullName || "");
      }
      if (sortOption === "pending-first") {
        const aDone = !!getLatestCallForPerson(a);
        const bDone = !!getLatestCallForPerson(b);
        if (aDone === bDone) return (a.fullName || "").localeCompare(b.fullName || "");
        return aDone ? 1 : -1;
      }
      if (sortOption === "recent") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

  const assignedCount = people.filter((p) => !!p.assignedVolunteerId || !!p.assignedVolunteer).length;
  const unassignedCount = people.length - assignedCount;
  const completedCallsCount = people.filter((p) => !!getLatestCallForPerson(p)).length;
  const pendingCallsCount = people.length - completedCallsCount;

  const handleSelectAll = () => {
    if (filteredPeople.length > 0 && selectedIds.length === filteredPeople.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPeople.map((p) => p.id));
    }
  };

  const toggleSelectPerson = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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

        {/* View Mode Switcher: My Data (Default) vs Other Users' Data + Assign Multiple Button */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Assign Multiple Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedIds.length === 0) {
                const pendingIds = filteredPeople.filter((p) => !getLatestCallForPerson(p)).map((p) => p.id);
                if (pendingIds.length > 0) {
                  setSelectedIds(pendingIds);
                  setIsAssignMultipleOpen(true);
                } else if (filteredPeople.length > 0) {
                  setSelectedIds(filteredPeople.map((p) => p.id));
                  setIsAssignMultipleOpen(true);
                } else {
                  alert("No devotees available to assign.");
                }
              } else {
                setIsAssignMultipleOpen(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition ${
              selectedIds.length > 0
                ? "bg-[#08415C] text-white border border-[#D4AF37]/50 shadow-gold"
                : "bg-white hover:bg-stone-50 border border-[#E5D8B8] text-[#08415C]"
            }`}
            title="Assign selected devotees to one or multiple volunteers"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Assign Multiple {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</span>
          </button>
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
        <div className="gold-card p-3 sm:p-4 space-y-3 shadow-xs">
          {/* 1. Search Bar & Filters Toggle (matches admin screenshot) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or number..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C] placeholder:text-stone-400 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap ${
                showFilters || toCallFilter !== "ALL" || selectedCampaign !== "ALL"
                  ? "bg-[#08415C] text-white border-[#08415C]"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Collapsible / Expandable Filter Options */}
          {showFilters && (
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5D8B8] space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-stone-600 flex-wrap gap-2">
                <span className="font-bold text-stone-700">Filter By Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setToCallFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      toCallFilter === "ALL"
                        ? "bg-[#08415C] text-white shadow-xs"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    All ({people.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setToCallFilter("ASSIGNED")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      toCallFilter === "ASSIGNED"
                        ? "bg-[#00A896] text-white shadow-xs"
                        : "bg-white text-[#007F70] border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Assigned ({assignedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToCallFilter("UNASSIGNED")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      toCallFilter === "UNASSIGNED"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <UserX className="w-3 h-3" />
                    <span>Unassigned ({unassignedCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToCallFilter("PENDING")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      toCallFilter === "PENDING"
                        ? "bg-[#08415C] text-white shadow-xs"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span>To Call ({pendingCallsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToCallFilter("COMPLETED")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      toCallFilter === "COMPLETED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <span>Completed ({completedCallsCount})</span>
                  </button>
                </div>
              </div>

              {availableCampaigns.length > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60 text-xs">
                  <span className="font-bold text-stone-700">Course / Batch:</span>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="p-1.5 border border-stone-200 rounded-lg bg-white text-xs text-stone-700 outline-none"
                  >
                    <option value="ALL">All Batches</option>
                    {availableCampaigns.map((camp) => (
                      <option key={camp} value={camp}>
                        {camp}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 2. Sub-bar: Devotees Count + Select All, WhatsApp Report & Sort Dropdown */}
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-0.5 pb-0.5 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800 select-none">
                <input
                  type="checkbox"
                  checked={filteredPeople.length > 0 && selectedIds.length === filteredPeople.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded accent-[#08415C] cursor-pointer"
                />
                <span className="text-[13px]">{filteredPeople.length} Devotees</span>
              </label>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAssignMultipleOpen(true)}
                  className="px-2.5 py-1 bg-[#08415C] hover:bg-[#063349] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition"
                >
                  <UserCheck className="w-3 h-3 text-[#D4AF37]" />
                  <span>Assign {selectedIds.length} Selected ➔</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp Calling Report Button */}
              <button
                type="button"
                onClick={() => {
                  setReportCopied(false);
                  setIsReportModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                title="Send or copy calling completion report to WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp Calling Report</span>
                <span className="sm:hidden">Report</span>
              </button>

              {/* Sort Dropdown */}
              <div className="relative flex items-center">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg pl-2 pr-6 py-1.5 appearance-none cursor-pointer hover:bg-stone-50 outline-none shadow-2xs"
                >
                  <option value="name-asc">⇅ Name A-Z</option>
                  <option value="name-desc">⇅ Name Z-A</option>
                  <option value="pending-first">⇅ To Call First</option>
                  <option value="recent">⇅ Recently Added</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Devotee Cards List (Compact View matching admin screenshot) */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-12 text-center text-xs text-stone-500">
                <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                <p>Loading calling queue...</p>
              </div>
            ) : filteredPeople.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-semibold text-stone-700">
                  {searchQuery
                    ? `No devotees found matching "${searchQuery}".`
                    : toCallFilter === "PENDING"
                    ? "Wonderful! All assigned devotees have been called."
                    : toCallFilter === "UNASSIGNED"
                    ? "Great! All devotees are currently assigned to callers."
                    : toCallFilter === "ASSIGNED"
                    ? "No assigned devotees found in this queue."
                    : "No devotees found in this queue."}
                </p>
                {(toCallFilter !== "ALL" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setToCallFilter("ALL");
                      setSearchQuery("");
                    }}
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
                const isAssigned = !!person.assignedVolunteerId || !!person.assignedVolunteer;
                const photoUrl = getPersonPhoto(person);
                const avatarColor = getAvatarColor(person.fullName);

                return (
                  <div
                    key={person.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition flex items-center justify-between gap-2.5 sm:gap-3.5 shadow-2xs hover:shadow-xs relative ${
                      isCompleted && outcomeConfig
                        ? `${outcomeConfig.cardBg} border-emerald-200/70`
                        : isAssigned
                        ? "bg-white border-stone-200/90 hover:border-emerald-300"
                        : "bg-[#FFFDF7] border-amber-200/80 hover:border-amber-300"
                    }`}
                  >
                    {/* Left: Checkbox + Avatar (Photo or Colored Initials) */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(person.id)}
                        onChange={(e) => toggleSelectPerson(person.id, e)}
                        className="w-4 h-4 rounded accent-[#08415C] cursor-pointer"
                        title="Select devotee"
                      />

                      {/* Circular Avatar */}
                      <div
                        onClick={() => openPersonModal(person.id, filteredPeople.map((p) => p.id))}
                        className="cursor-pointer flex-shrink-0"
                        title="Click to view devotee profile"
                      >
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={person.fullName}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-xs"
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm tracking-wide shadow-2xs select-none ${avatarColor.bg} ${avatarColor.text}`}
                          >
                            {getInitials(person.fullName)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Column: Name, Batch/Course Tags, Caller Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => openPersonModal(person.id, filteredPeople.map((p) => p.id))}
                          className="font-bold text-[13px] sm:text-[15px] text-stone-900 leading-tight hover:text-[#08415C] hover:underline cursor-pointer truncate max-w-full"
                        >
                          {person.fullName}
                        </span>
                      </div>

                      {/* Batch Tags / Pills Row */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {/* Course Enrollment Batch */}
                        {person.courseEnrollments && person.courseEnrollments.length > 0 ? (
                          person.courseEnrollments.map((enr: any) => (
                            <span
                              key={enr.id}
                              className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] border border-emerald-200/60 flex items-center gap-1 leading-none shadow-2xs"
                              title={`Course: ${enr.course?.title || "Course"} (${enr.batch?.batchName || "Batch"})`}
                            >
                              <span>🎓</span>
                              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                {enr.batch?.batchName || enr.course?.title}
                              </span>
                            </span>
                          ))
                        ) : null}

                        {/* Tags Pill */}
                        {person.tags && (
                          <span
                            className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-amber-200/60 flex items-center gap-1 leading-none shadow-2xs"
                            title={`Tag: ${person.tags}`}
                          >
                            <span>🏷️</span>
                            <span className="truncate max-w-[140px] sm:max-w-[180px]">{person.tags}</span>
                          </span>
                        )}

                        {/* Fallback to source if no enrollment or tag */}
                        {(!person.courseEnrollments || person.courseEnrollments.length === 0) &&
                          !person.tags &&
                          person.source &&
                          person.source !== "Reference" &&
                          person.source !== "Excel Import" && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 leading-none">
                              {person.source}
                            </span>
                          )}
                        {/* Last Attendance Indicator (Admin requirement: show whether they attended last time) */}
                        {(() => {
                          const lastAtt = person.sessionAttendances && person.sessionAttendances.length > 0 ? person.sessionAttendances[0] : null;
                          if (!lastAtt) {
                            return (
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200 flex items-center gap-1 leading-none"
                                title="No attendance record found for previous sessions"
                              >
                                <span>⚪</span>
                                <span>No prev. attendance</span>
                              </span>
                            );
                          }
                          const isAttended = lastAtt.status === "PRESENT";
                          const sessTitle = lastAtt.session ? `S${lastAtt.session.sessionNumber}` : "Last Session";
                          const dateFormatted = lastAtt.session?.sessionDate
                            ? new Date(lastAtt.session.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : "";

                          return (
                            <span
                              className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 leading-none shadow-2xs ${
                                isAttended
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                              title={`Last Attendance: ${isAttended ? "Present" : "Absent"} at ${sessTitle} (${dateFormatted})`}
                            >
                              <span>{isAttended ? "🟢" : "🔴"}</span>
                              <span>
                                Last {isAttended ? "Present" : "Absent"}: {sessTitle} {dateFormatted ? `(${dateFormatted})` : ""}
                              </span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Caller Line */}
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>
                          Caller:{" "}
                          {person.assignedVolunteer?.name ? (
                            <strong className="text-stone-700 font-semibold">{person.assignedVolunteer.name}</strong>
                          ) : (
                            <span className="text-amber-700 font-semibold italic">Unassigned</span>
                          )}
                        </span>

                        {isCompleted && outcomeConfig && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border flex items-center gap-0.5 ${outcomeConfig.badgeColor}`}
                          >
                            <span>{outcomeConfig.icon}</span>
                            <span>{outcomeConfig.label}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Stage + Menu (Top) | Phone + Location (Mid) | Call + WhatsApp (Bottom) */}
                    <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 text-right gap-1">
                      {/* Top: Stage badge + More options menu */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-blue-200/60 leading-none shadow-2xs">
                          {person.stage || "Devotee"}
                        </span>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuPersonId(menuPersonId === person.id ? null : person.id);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* 3-Dots Dropdown Menu */}
                          {menuPersonId === person.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-6 z-30 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1 text-left text-xs text-stone-700"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuPersonId(null);
                                  openPersonModal(person.id, filteredPeople.map((p) => p.id));
                                }}
                                className="w-full px-3 py-1.5 hover:bg-stone-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-stone-500" />
                                <span>View Full Profile</span>
                              </button>

                              {hasPermission("calling:assign") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuPersonId(null);
                                    setReassigningId(person.id);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-[#00A896]" />
                                  <span>Reassign Caller</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuPersonId(null);
                                  openCallModal(person);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-stone-50 flex items-center gap-2 text-emerald-700 font-medium"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Log Call Response</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle: Phone + Location */}
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] sm:text-xs font-mono font-semibold text-stone-700 leading-tight">
                          +91 {person.mobile}
                        </span>
                        <span className="text-[10px] text-stone-500 flex items-center gap-0.5 leading-tight mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-stone-400" />
                          <span>{person.area || "Chandkheda"}</span>
                        </span>
                      </div>

                      {/* Bottom: Action Buttons (Mint Call Button + Vibrant WhatsApp Button) */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => openCallModal(person)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] active:bg-[#A7F3D0] text-[#059669] flex items-center justify-center transition shadow-2xs border border-emerald-200/60"
                          title={isCompleted ? "Call Again / Update Response" : "Call Devotee"}
                        >
                          <Phone className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openWhatsAppModal(person)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] active:bg-[#1EAA50] text-white flex items-center justify-center transition shadow-2xs"
                          title="Send WhatsApp Message"
                        >
                          <MessageSquare className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Reassign overlay if triggered */}
                    {reassigningId === person.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-x-2 bottom-2 z-20 bg-stone-50 p-2 rounded-xl border border-stone-300 shadow-md flex items-center gap-2"
                      >
                        <span className="text-xs font-bold text-stone-700">Assign To:</span>
                        <select
                          value={targetVolunteerId}
                          onChange={(e) => setTargetVolunteerId(e.target.value)}
                          className="text-xs p-1.5 border rounded-lg bg-white outline-none flex-1"
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
                          className="px-3 py-1.5 bg-[#08415C] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setReassigningId(null)}
                          className="px-2 py-1.5 text-stone-500 hover:text-stone-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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

      {/* Sticky Bottom Action Bar for Bulk Assignment */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md bg-[#08415C] text-white p-3.5 rounded-2xl shadow-2xl border border-[#D4AF37]/60 flex items-center justify-between gap-3 z-40 animate-slideUp">
          <div className="text-xs">
            <span className="font-bold text-[#D4AF37] text-sm">{selectedIds.length}</span> devotees selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-stone-300 hover:text-white transition"
            >
              Deselect
            </button>
            <button
              type="button"
              onClick={() => setIsAssignMultipleOpen(true)}
              className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#c49f27] text-[#08415C] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Calls</span>
            </button>
          </div>
        </div>
      )}

      {/* Assign Multiple Calls Modal */}
      <AssignMultipleModal
        isOpen={isAssignMultipleOpen}
        onClose={() => setIsAssignMultipleOpen(false)}
        selectedIds={selectedIds}
        volunteers={volunteers}
        onSuccess={() => {
          setSelectedIds([]);
          fetchData();
        }}
      />

      {/* WhatsApp Calling Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setIsReportModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-stone-200 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-stone-900">
                    WhatsApp Calling Summary Report
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Directly send or copy formatted calling summary for group / coordinator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Formatted Report Preview Box */}
            <div className="relative">
              <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Report Preview (Copy or Send to WhatsApp):
              </label>
              <textarea
                readOnly
                rows={11}
                value={generateReportText()}
                className="w-full p-3 font-mono text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 leading-relaxed focus:outline-none select-all"
              />
            </div>

            {/* Actions: Copy to Clipboard & Open WhatsApp */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generateReportText());
                  setReportCopied(true);
                  setTimeout(() => setReportCopied(false), 2500);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  reportCopied
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                <span>{reportCopied ? "✓ Copied!" : "📋 Copy Report"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3.5 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generateReportText())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-current" />
                  <span>Send to WhatsApp ➔</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
