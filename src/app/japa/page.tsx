"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import { CircleDot, Sparkles, Plus, Award } from "lucide-react";

export default function JapaPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/japa")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <CircleDot className="w-6 h-6 text-[#D4AF37]" />
          Japa / Mala Chanting Sadhana Tracker
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Voluntary chanting logs for devotee spiritual encouragement and chanting milestones
        </p>
      </div>

      <div className="gold-card p-5 space-y-4">
        <h3 className="font-serif font-bold text-base text-[#08415C]">
          Recent Devotee Chanting Logs
        </h3>

        <div className="divide-y divide-[#E5D8B8]/60">
          {logs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-serif font-bold text-sm text-[#08415C]">
                  {log.person?.fullName}
                </span>
                <span className="text-[#78909C] ml-2">({log.person?.area})</span>
                <p className="text-[#37474F] mt-0.5">{log.remarks || "Daily chanting completed."}</p>
              </div>
              <div className="text-right">
                <Badge variant="gold">📿 {log.rounds} Rounds</Badge>
                <div className="text-[10px] text-[#78909C] mt-1">
                  {new Date(log.date).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
