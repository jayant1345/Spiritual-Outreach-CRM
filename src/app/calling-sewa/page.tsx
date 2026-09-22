"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  PhoneCall,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function CallingSewaPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [people, setPeople] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState("ALL");

  useEffect(() => {
    fetchPeople();
    fetchVolunteers();
  }, [refreshTrigger, selectedVolunteer]);

  const fetchPeople = async () => {
    try {
      const url = selectedVolunteer !== "ALL" ? `/api/people?volunteerId=${selectedVolunteer}` : "/api/people";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setPeople(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch("/api/volunteers");
      const data = await res.json();
      if (Array.isArray(data)) setVolunteers(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-[#D4AF37]" />
            Calling Sewa & Workload Distribution
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Campaign task allocation, balanced devotee distribution across volunteer calling teams, and real-time disposition logs
          </p>
        </div>
      </div>

      {/* Volunteer Workload Distribution Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {volunteers.map((vol) => (
          <div
            key={vol.id}
            onClick={() => setSelectedVolunteer(selectedVolunteer === vol.id ? "ALL" : vol.id)}
            className={`gold-card p-4 cursor-pointer transition ${
              selectedVolunteer === vol.id
                ? "ring-2 ring-[#08415C] border-[#D4AF37]"
                : "hover:border-[#D4AF37]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-serif font-bold text-sm text-[#08415C] flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-[#08415C] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center">
                  {vol.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <span>{vol.name}</span>
              </div>
              <Badge variant="morpankh" size="sm">{vol.role.replace("_", " ")}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs mt-3">
              <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E5D8B8]">
                <div className="font-bold text-[#08415C] text-sm">{vol._count?.assignedPeople || 0}</div>
                <div className="text-[10px] text-[#78909C]">Assigned Devotees</div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="font-bold text-[#00A896] text-sm">{vol._count?.callLogs || 0}</div>
                <div className="text-[10px] text-[#00A896]">Calls Completed</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calling List for Selected / All Volunteers */}
      <div className="gold-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5D8B8]/70 pb-3">
          <h3 className="font-serif font-bold text-base text-[#08415C]">
            Active Calling Queue ({people.length} Devotees)
          </h3>
          {selectedVolunteer !== "ALL" && (
            <button
              onClick={() => setSelectedVolunteer("ALL")}
              className="text-xs text-[#B8860B] hover:underline font-semibold"
            >
              Clear Volunteer Filter
            </button>
          )}
        </div>

        <div className="divide-y divide-[#E5D8B8]/60">
          {people.map((p) => (
            <div
              key={p.id}
              className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] px-2 rounded-xl transition"
            >
              <div
                className="cursor-pointer"
                onClick={() => openPersonModal(p.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#08415C]">
                    {p.fullName}
                  </span>
                  <Badge variant="morpankh">{p.stage}</Badge>
                </div>
                <div className="text-xs text-[#78909C] flex items-center gap-2 mt-0.5">
                  <span>+91 {p.mobile}</span>
                  <span>•</span>
                  <span>{p.area || "Chandkheda"}</span>
                  <span>•</span>
                  <span>Assigned: {p.assignedVolunteer?.name || "Unassigned"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCallModal(p)}
                  className="px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Log Call
                </button>
                <button
                  onClick={() => openWhatsAppModal(p)}
                  className="px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
