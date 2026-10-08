"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Search,
  Plus,
  Bell,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CRMContext } from "./RootShell";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onOpenAddPerson?: () => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddPerson,
  onOpenMobileMenu,
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { openPersonModal, openCallModal } = useContext(CRMContext);

  const [activeCenter] = useState("Chandkheda Center");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Search Bar State
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification Bell State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifData, setNotifData] = useState<{
    totalPending: number;
    overdue: any[];
    today: any[];
    upcoming: any[];
  }>({ totalPending: 0, overdue: [], today: [], upcoming: [] });
  const [activeNotifTab, setActiveNotifTab] = useState<"today" | "overdue" | "upcoming">("today");
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch search results on input change
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifData(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkTaskComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Admin", bg: "bg-[#08415C]", text: "text-white", border: "border-[#D4AF37]" };
      case "COORDINATOR":
        return { label: "Coordinator", bg: "bg-emerald-700", text: "text-white", border: "border-emerald-500" };
      case "CALLING_VOLUNTEER":
        return { label: "Caller", bg: "bg-blue-600", text: "text-white", border: "border-blue-400" };
      case "RELATIONSHIP_VOLUNTEER":
        return { label: "Counselor", bg: "bg-amber-600", text: "text-white", border: "border-amber-400" };
      default:
        return { label: "Volunteer", bg: "bg-stone-600", text: "text-white", border: "border-stone-400" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#FAF8F5]/90 backdrop-blur-xl border-b border-[#E5D8B8] px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shadow-xs w-full max-w-full">
      {/* Mobile Hamburger Drawer Trigger */}
      {onOpenMobileMenu && (
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white border border-[#E5D8B8] text-[#08415C] hover:bg-[#08415C]/10 transition flex items-center justify-center flex-shrink-0"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#08415C]" />
        </button>
      )}

      {/* Active Global Search Bar */}
      <div ref={searchRef} className="flex-1 max-w-xl relative min-w-0">
        <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78909C]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setIsSearchOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              setIsSearchOpen(false);
              router.push(`/people?query=${encodeURIComponent(query.trim())}`);
            }
          }}
          placeholder="Search Members, Phone, Locality..."
          className="w-full pl-8 sm:pl-10 pr-7 sm:pr-8 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs sm:text-sm text-[#0B192C] placeholder-[#78909C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C] shadow-xs transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsSearchOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 max-h-96 overflow-y-auto animate-fadeIn">
            <div className="px-3.5 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-semibold">
              <span>{isSearching ? "Searching..." : `Found ${searchResults.length} members`}</span>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  router.push(`/people?query=${encodeURIComponent(query.trim())}`);
                }}
                className="text-[#08415C] hover:underline flex items-center gap-1 font-bold"
              >
                <span>View all in Directory</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {searchResults.length === 0 && !isSearching && (
              <div className="p-4 text-center text-xs text-stone-500">
                No matching members found for "{query}".
              </div>
            )}

            {searchResults.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setIsSearchOpen(false);
                  openPersonModal(member.id);
                }}
                className="w-full px-3.5 py-2.5 text-left hover:bg-stone-50 flex items-center justify-between gap-3 transition border-b border-stone-50 last:border-none"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#08415C] truncate flex items-center gap-2">
                    <span>{member.fullName}</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                      {member.stage || "Member"}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{member.mobile}</span>
                    {member.area && <span>• {member.area}</span>}
                    {member.profession && <span>• {member.profession}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-[#08415C] font-semibold flex items-center gap-1 flex-shrink-0">
                  <span>360° Profile</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Center Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold text-[#08415C] shadow-xs">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{activeCenter}</span>
        </div>

        {/* Notification Bell 🔔 */}
        <div ref={notifRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 sm:px-2.5 sm:py-2 bg-white border border-[#E5D8B8] rounded-xl text-stone-700 hover:text-[#08415C] hover:border-[#08415C] transition shadow-xs flex items-center gap-1.5 relative"
            title="Pending tasks and reminders"
            aria-label="Pending notifications"
          >
            <Bell className="w-4 h-4 text-[#08415C]" />
            {notifData.totalPending > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifData.totalPending}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 py-2.5 z-50 animate-fadeIn">
              <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#08415C]" />
                    <span>Pending Tasks & Reminders</span>
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    {notifData.totalPending} items requiring your seva action
                  </p>
                </div>
                {notifData.totalPending > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {notifData.totalPending} Pending
                  </span>
                )}
              </div>

              {/* Tabs: Today, Overdue, Upcoming */}
              <div className="flex border-b border-stone-100 px-3 pt-2 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveNotifTab("today")}
                  className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition ${
                    activeNotifTab === "today"
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Today ({notifData.today.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotifTab("overdue")}
                  className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition ${
                    activeNotifTab === "overdue"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-rose-700 hover:bg-rose-50"
                  }`}
                >
                  Overdue ({notifData.overdue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveNotifTab("upcoming")}
                  className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] transition ${
                    activeNotifTab === "upcoming"
                      ? "bg-[#08415C] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  Upcoming ({notifData.upcoming.length})
                </button>
              </div>

              {/* Task Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 p-1">
                {(activeNotifTab === "today"
                  ? notifData.today
                  : activeNotifTab === "overdue"
                  ? notifData.overdue
                  : notifData.upcoming
                ).length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                    <p className="font-semibold text-stone-700">All cleared!</p>
                    <p className="text-[11px]">No {activeNotifTab} pending tasks.</p>
                  </div>
                ) : (
                  (activeNotifTab === "today"
                    ? notifData.today
                    : activeNotifTab === "overdue"
                    ? notifData.overdue
                    : notifData.upcoming
                  ).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (t.person?.id) openPersonModal(t.person.id);
                      }}
                      className="p-3 hover:bg-stone-50 rounded-xl transition cursor-pointer flex items-start justify-between gap-2.5"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              activeNotifTab === "overdue" ? "bg-rose-500" : "bg-amber-500"
                            }`}
                          />
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {t.type} with {t.person?.fullName || "Member"}
                          </p>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">{t.remarks || t.person?.mobile}</p>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400">
                          <Calendar className="w-3 h-3 text-[#D4AF37]" />
                          <span>Due: {new Date(t.dueDate).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                        {t.person && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsNotifOpen(false);
                              openCallModal(t.person);
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            title="Call Now"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleMarkTaskComplete(t.id, e)}
                          className="p-1.5 bg-stone-100 hover:bg-emerald-600 hover:text-white rounded-lg transition text-stone-600"
                          title="Mark Done"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rename: + Add New Members (Previously + Add Seeker) */}
        {onOpenAddPerson && (
          <button
            onClick={onOpenAddPerson}
            className="p-2 sm:px-3.5 sm:py-2 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition flex-shrink-0"
            title="Add New Member"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">+ Add Member</span>
          </button>
        )}

        {/* Profile Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#08415C] transition shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-[#08415C] text-white flex items-center justify-center border border-[#D4AF37]">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="text-xs font-bold text-[#0B192C] leading-none">{user?.name || "Guest"}</div>
              <div className="mt-0.5 flex items-center gap-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  {badge.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-stone-100">
                <div className="text-xs font-bold text-stone-900">{user?.name}</div>
                <div className="text-[11px] text-stone-500 truncate">{user?.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    Role: {badge.label}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out of Sewa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
