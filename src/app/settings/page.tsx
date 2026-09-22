"use client";

import React, { useState } from "react";
import Badge from "@/components/common/Badge";
import { Sliders, Plus, Check, ShieldCheck, Database } from "lucide-react";

export default function SettingsPage() {
  const [stages, setStages] = useState([
    "New Person",
    "Contacted",
    "Interested",
    "Invited",
    "Confirmed",
    "Attended",
    "Relationship Follow-up",
    "Connected",
  ]);

  const [sources, setSources] = useState([
    "Friend / Reference",
    "Society Outreach",
    "Book Distribution",
    "Program Stall",
    "Instagram / YouTube",
    "Website Form",
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-[#D4AF37]" />
          CRM Settings & No-Code Customization
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Administer custom pipeline stages, lead sources, call dispositions, and dynamic custom fields without code modification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Custom Journey Stages */}
        <div className="gold-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#08415C]">
              Devotee Journey Stages
            </h3>
            <span className="text-xs text-[#78909C]">{stages.length} Active Stages</span>
          </div>

          <div className="space-y-2">
            {stages.map((stg, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono w-4">{idx + 1}.</span>
                  <span className="font-semibold text-[#08415C]">{stg}</span>
                </div>
                <Badge variant="emerald" size="sm">Active</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Lead Sources */}
        <div className="gold-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#08415C]">
              Lead & Outreach Sources
            </h3>
            <span className="text-xs text-[#78909C]">{sources.length} Configured</span>
          </div>

          <div className="space-y-2">
            {sources.map((src, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-mono w-4">{idx + 1}.</span>
                  <span className="font-semibold text-[#08415C]">{src}</span>
                </div>
                <Badge variant="gold" size="sm">Standard</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
