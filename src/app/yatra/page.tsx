"use client";

import React from "react";
import Badge from "@/components/common/Badge";
import { Compass, Calendar, MapPin, Users } from "lucide-react";

export default function YatraPage() {
  const yatras = [
    {
      name: "Sri Vrindavan Dham Kartik Yatra 2026",
      date: "November 7, 2026",
      location: "Vrindavan, Govardhan, Barsana",
      participants: 120,
      status: "Registration Open",
    },
    {
      name: "Sri Mayapur & Jagannath Puri Parikrama",
      date: "April 26, 2026",
      location: "Mayapur & Puri",
      participants: 85,
      status: "Completed",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-[#D4AF37]" />
          Yatra & Spiritual Activities Tracker
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Manage devotee pilgrimages, retreats, and spiritual expeditions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {yatras.map((yatra, idx) => (
          <div key={idx} className="gold-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={yatra.status === "Completed" ? "neutral" : "emerald"}>
                {yatra.status}
              </Badge>
              <span className="text-xs text-[#78909C] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> {yatra.date}
              </span>
            </div>

            <h3 className="font-serif font-bold text-lg text-[#08415C]">
              {yatra.name}
            </h3>
            <p className="text-xs text-[#78909C] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#00A896]" /> {yatra.location}
            </p>

            <div className="pt-2 border-t border-[#E5D8B8]/60 flex items-center justify-between text-xs">
              <span className="text-[#37474F] font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#08415C]" /> {yatra.participants} Devotees Joined
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
