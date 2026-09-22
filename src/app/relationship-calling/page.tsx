"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  HeartHandshake,
  PhoneCall,
  MessageSquare,
  Calendar,
  Sparkles,
  Search,
  UserCheck,
} from "lucide-react";

export default function RelationshipCallingPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, [refreshTrigger]);

  const fetchPeople = async () => {
    try {
      const res = await fetch("/api/people?stage=Relationship Follow-up");
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <HeartHandshake className="w-6 h-6 text-[#D4AF37]" />
          Relationship Calling & Devotee Care
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Long-term spiritual nurturing, festival greetings, post-program follow-up, and ongoing devotee care
        </p>
      </div>

      {/* Relationship Stewardship Roster */}
      <div className="gold-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5D8B8]/70 pb-3">
          <h3 className="font-serif font-bold text-base text-[#08415C]">
            Devotees in Relationship Care Stage ({people.length})
          </h3>
          <span className="text-xs text-[#B8860B] font-semibold">
            30-Day Check-in Cadence
          </span>
        </div>

        <div className="divide-y divide-[#E5D8B8]/60">
          {people.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78909C]">
              No devotees currently in relationship follow-up stage.
            </div>
          ) : (
            people.map((p) => (
              <div
                key={p.id}
                className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] px-2 rounded-xl transition"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => openPersonModal(p.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-[#08415C]">
                      {p.fullName}
                    </span>
                    {p.japaDailyRounds > 0 && (
                      <Badge variant="gold">📿 {p.japaDailyRounds} Rounds</Badge>
                    )}
                    <span className="text-xs text-[#78909C]">• {p.area || "Chandkheda"}</span>
                  </div>
                  <p className="text-xs text-[#37474F] mt-1">
                    Steward: <strong>{p.relationshipVolunteer?.name || "Priya Devi"}</strong> • {p.notes || "Regular connection"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCallModal(p)}
                    className="px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Well-being Call
                  </button>
                  <button
                    onClick={() => openWhatsAppModal(p)}
                    className="px-3 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Send Greeting
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
