"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  Users,
  PhoneCall,
  CalendarDays,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  ShieldCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeQueueTab, setActiveQueueTab] = useState<"today" | "callbacks" | "absentee">("today");

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="py-24 text-center text-[#78909C]">
        <div className="inline-block animate-spin text-3xl text-[#D4AF37] mb-3">🪷</div>
        <p className="text-sm font-semibold text-[#08415C]">
          Loading Chandkheda Spiritual Outreach Executive Cockpit...
        </p>
      </div>
    );
  }

  const upcomingProg = stats.upcomingProgram || {
    title: "Bhagavad Gita Intro Seminar",
    eventDate: new Date("2026-09-28"),
    totalInvited: 500,
    confirmedRSVPs: 280,
  };

  return (
    <div className="space-y-7">
      {/* Page Title & Spiritual Greeting Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
            <span>🪷 Sri Sri Radha Govind Seva</span>
            <span>•</span>
            <span>Chandkheda Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] mt-0.5">
            Spiritual Outreach & Relationship Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl font-medium text-[#37474F] shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00A896]"></span>
            Active Sewa Cadence
          </span>
          <span className="px-3 py-1.5 bg-[#FAF5E6] border border-[#D4AF37]/40 rounded-xl font-semibold text-[#B8860B] shadow-sm">
            September 2026
          </span>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total People */}
        <div className="gold-card p-5 space-y-2 border-t-4 border-t-[#08415C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78909C] uppercase tracking-wider">
              Total Seekers & Devotees
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#08415C]/10 text-[#08415C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#08415C]">
              {stats.totalPeople || 2840}
            </span>
            <span className="text-xs font-semibold text-[#00A896] bg-emerald-50 px-1.5 py-0.5 rounded">
              +124 this month
            </span>
          </div>
          <p className="text-[11px] text-[#78909C]">
            Central Master Person DB
          </p>
        </div>

        {/* Card 2: Calling Sewa Due */}
        <div className="gold-card p-5 space-y-2 border-t-4 border-t-[#D4AF37]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78909C] uppercase tracking-wider">
              Today&apos;s Calling Sewa
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#08415C]">
              {stats.callsPending || 38} Due
            </span>
            <span className="text-xs font-medium text-[#78909C]">
              ({stats.callsCompleted || 18} Completed)
            </span>
          </div>
          <p className="text-[11px] text-[#78909C]">
            Calls & absent follow-ups pending
          </p>
        </div>

        {/* Card 3: Gita Program RSVPs */}
        <div className="gold-card p-5 space-y-2 border-t-4 border-t-[#00A896]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78909C] uppercase tracking-wider">
              Gita Program RSVPs
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A896] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#08415C]">
              {upcomingProg.confirmedRSVPs} Confirmed
            </span>
            <span className="text-xs font-medium text-[#78909C]">
              / {upcomingProg.totalInvited} Invited
            </span>
          </div>
          {/* Progress Mini Bar */}
          <div className="w-full bg-[#FAF8F5] h-1.5 rounded-full overflow-hidden border border-[#E5D8B8]">
            <div
              className="bg-[#00A896] h-full rounded-full"
              style={{
                width: `${Math.round((upcomingProg.confirmedRSVPs / upcomingProg.totalInvited) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Active Course Regularity */}
        <div className="gold-card p-5 space-y-2 border-t-4 border-t-[#0B4F6C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#78909C] uppercase tracking-wider">
              Course Students Regularity
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#0B4F6C]/10 text-[#0B4F6C] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#08415C]">
              {stats.courseStudents || 50} Enrolled
            </span>
            <span className="text-xs font-semibold text-[#00A896] bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.regularCount || 38} Regular
            </span>
          </div>
          <p className="text-[11px] text-[#78909C]">
            Gita Shiksha Course (Batch 1)
          </p>
        </div>
      </div>

      {/* Main Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Calling Sewa Priority Work Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="gold-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5D8B8]/70 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#08415C] flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
                  Calling Sewa Priority Queue
                </h3>
                <p className="text-xs text-[#78909C]">
                  Personalized outreach & follow-up queue for volunteers
                </p>
              </div>

              {/* Queue Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs font-medium">
                <button
                  onClick={() => setActiveQueueTab("today")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueTab === "today"
                      ? "bg-[#08415C] text-white font-semibold shadow-sm"
                      : "text-[#37474F] hover:bg-white"
                  }`}
                >
                  Today&apos;s Calls
                </button>
                <button
                  onClick={() => setActiveQueueTab("callbacks")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueTab === "callbacks"
                      ? "bg-[#08415C] text-white font-semibold shadow-sm"
                      : "text-[#37474F] hover:bg-white"
                  }`}
                >
                  Callbacks (5)
                </button>
                <button
                  onClick={() => setActiveQueueTab("absentee")}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeQueueTab === "absentee"
                      ? "bg-[#08415C] text-white font-semibold shadow-sm"
                      : "text-[#37474F] hover:bg-white"
                  }`}
                >
                  Absentee (8)
                </button>
              </div>
            </div>

            {/* Devotee Cards List */}
            <div className="space-y-3">
              {stats.priorityCalls && stats.priorityCalls.length > 0 ? (
                stats.priorityCalls.map((person: any) => (
                  <div
                    key={person.id}
                    className="p-3.5 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#D4AF37] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => openPersonModal(person.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-sm text-[#08415C] group-hover:text-[#0B4F6C]">
                          {person.fullName}
                        </span>
                        <Badge variant="morpankh">{person.stage}</Badge>
                        {person.area && (
                          <span className="text-[11px] text-[#78909C] flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-[#D4AF37]" /> {person.area}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#37474F] mt-1 line-clamp-1">
                        {person.notes || `Assigned to: ${person.assignedVolunteer?.name || "Volunteer"}`}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openCallModal(person)}
                        className="px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 transition"
                        title="Click to Dial"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call
                      </button>
                      <button
                        onClick={() => openWhatsAppModal(person)}
                        className="px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1 transition"
                        title="Send WhatsApp Template"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[#78909C]">
                  All calling queue tasks completed for today! Haribol!
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#78909C]">
              <span>Showing 5 priority calling tasks</span>
              <Link
                href="/calling-sewa"
                className="font-semibold text-[#08415C] hover:text-[#B8860B] flex items-center gap-1"
              >
                View Full Calling Sewa Module <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols): Programs & Courses Regularity Hub */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upcoming Program Funnel Card */}
          <div className="gold-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#B8860B] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Upcoming Program
              </span>
              <Badge variant="emerald">Sunday 5:00 PM</Badge>
            </div>

            <h4 className="font-serif font-bold text-base text-[#08415C]">
              Bhagavad Gita Introduction Seminar
            </h4>
            <p className="text-xs text-[#78909C]">
              Main Satsang Hall, Chandkheda Center • Speaker: HG Radheshyam Das
            </p>

            {/* Multi-Stage Conversion Funnel */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#37474F]">Invited (500) ➔ Confirmed YES (280)</span>
                <span className="font-bold text-[#08415C]">56% RSVP Rate</span>
              </div>
              <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E5D8B8] flex">
                <div className="bg-[#08415C] h-full" style={{ width: "56%" }} title="Confirmed YES (280)" />
                <div className="bg-[#D4AF37] h-full" style={{ width: "12%" }} title="Maybe (60)" />
                <div className="bg-gray-200 h-full" style={{ width: "32%" }} title="No Response" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#78909C] pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#08415C]"></span> 280 Confirmed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> 60 Maybe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span> 160 Awaiting
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5D8B8]/60 flex justify-end">
              <Link
                href="/programs"
                className="text-xs font-semibold text-[#08415C] hover:text-[#B8860B] flex items-center gap-1"
              >
                Manage Program Invitations <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Active Course Regularity Card */}
          <div className="gold-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#08415C] uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#08415C]" /> Active Course Progress
              </span>
              <Badge variant="morpankh">5 / 10 Sessions</Badge>
            </div>

            <h4 className="font-serif font-bold text-base text-[#08415C]">
              Gita Shiksha Course — Batch 1
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg">
                <div className="font-bold text-emerald-800 text-base">{stats.regularCount || 38}</div>
                <div className="text-[10px] text-emerald-700">Regular (≥75%)</div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg">
                <div className="font-bold text-amber-800 text-base">{stats.irregularCount || 7}</div>
                <div className="text-[10px] text-amber-700">Irregular (50-74%)</div>
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-bold text-red-800 text-base">{stats.lowCount || 3}</div>
                <div className="text-[10px] text-red-700">Low (&lt;50%)</div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5D8B8]/60 flex justify-end">
              <Link
                href="/courses"
                className="text-xs font-semibold text-[#08415C] hover:text-[#B8860B] flex items-center gap-1"
              >
                Open Session Attendance Grid <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Live Seva Activity Stream */}
          <div className="gold-card p-5 space-y-3">
            <h4 className="font-serif font-bold text-sm text-[#08415C] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#D9480F]" /> Live Seva Activity Stream
            </h4>
            <div className="space-y-2.5 text-xs">
              {stats.recentTimeline && stats.recentTimeline.slice(0, 4).map((item: any) => (
                <div key={item.id} className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-lg">
                  <div className="flex items-center justify-between text-[11px] text-[#78909C]">
                    <span className="font-semibold text-[#08415C]">{item.person?.fullName}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[#37474F] mt-0.5 line-clamp-1">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
