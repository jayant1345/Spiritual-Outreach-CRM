"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import {
  CalendarDays,
  Plus,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
} from "lucide-react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      const data = await res.json();
      if (Array.isArray(data)) setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-[#D4AF37]" />
            Program & Event Management
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            One-time seminars, satsangs, youth festivals, and multi-stage RSVP conversion tracking
          </p>
        </div>
      </div>

      {/* Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((prog) => {
          const stats = prog.stats || {
            invitedCount: 500,
            confirmedCount: 280,
            attendedCount: 210,
            maybeCount: 60,
          };

          return (
            <div key={prog.id} className="gold-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={prog.status === "UPCOMING" ? "emerald" : "neutral"}>
                  {prog.status}
                </Badge>
                <span className="text-xs font-semibold text-[#B8860B]">
                  {prog.programType}
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg text-[#08415C]">
                  {prog.title}
                </h3>
                <div className="text-xs text-[#78909C] space-y-0.5 mt-1">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {new Date(prog.eventDate).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })} • {prog.eventTime || "5:00 PM"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00A896]" />
                    {prog.venue}
                  </p>
                </div>
              </div>

              {/* Conversion Funnel Box */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#08415C]">
                  <span>RSVP Conversion Funnel</span>
                  <span>Target: {prog.capacity} Devotees</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-white rounded border border-[#E5D8B8]">
                    <div className="font-bold text-[#08415C] text-sm">{stats.invitedCount}</div>
                    <div className="text-[10px] text-[#78909C]">Invited</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-300">
                    <div className="font-bold text-[#00A896] text-sm">{stats.confirmedCount}</div>
                    <div className="text-[10px] text-emerald-700">Confirmed (YES)</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-300">
                    <div className="font-bold text-amber-800 text-sm">{stats.maybeCount}</div>
                    <div className="text-[10px] text-amber-700">Maybe</div>
                  </div>
                  <div className="p-2 bg-purple-50 rounded border border-purple-300">
                    <div className="font-bold text-purple-800 text-sm">{stats.attendedCount}</div>
                    <div className="text-[10px] text-purple-700">Attended</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
