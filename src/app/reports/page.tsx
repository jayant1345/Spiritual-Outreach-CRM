"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Badge from "@/components/common/Badge";
import { BarChart3, Download, FileSpreadsheet, Sparkles, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/people")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPeople(data);
      })
      .catch(console.error);
  }, []);

  const handleDownloadFullReport = () => {
    const data = people.map((p, idx) => ({
      "Sr No": idx + 1,
      "Devotee Name": p.fullName,
      "Mobile": p.mobile,
      "WhatsApp": p.whatsappNumber || p.mobile,
      "Area / Locality": p.area,
      "Stage": p.stage,
      "Source": p.source,
      "Assigned Sewak": p.assignedVolunteer?.name || "Unassigned",
      "Japa Rounds": p.japaDailyRounds || 0,
      "Registered On": new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Devotee Report");
    XLSX.writeFile(wb, "Chandkheda_CRM_Master_Report.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#D4AF37]" />
            Reports & Analytics Studio
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Cross-dimensional analysis across calling sewa performance, program attendance funnels, and course regularity
          </p>
        </div>

        <button
          onClick={handleDownloadFullReport}
          className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
          <span>Download Master Excel Report (.xlsx)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="gold-card p-5 space-y-3">
          <h3 className="font-serif font-bold text-base text-[#08415C]">
            Stage Distribution
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Relationship Follow-up</span>
              <span className="font-bold text-[#08415C]">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Confirmed for Gita Program</span>
              <span className="font-bold text-[#00A896]">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Contacted / Interested</span>
              <span className="font-bold text-[#B8860B]">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">New Seekers</span>
              <span className="font-bold text-gray-500">12%</span>
            </div>
          </div>
        </div>

        <div className="gold-card p-5 space-y-3">
          <h3 className="font-serif font-bold text-base text-[#08415C]">
            Top Lead Sources
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Book Distribution Stalls</span>
              <span className="font-bold text-[#08415C]">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Society Outreach Seminars</span>
              <span className="font-bold text-[#00A896]">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Friend & Family References</span>
              <span className="font-bold text-[#B8860B]">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Instagram / YouTube</span>
              <span className="font-bold text-gray-500">10%</span>
            </div>
          </div>
        </div>

        <div className="gold-card p-5 space-y-3">
          <h3 className="font-serif font-bold text-base text-[#08415C]">
            Course Attendance Health
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Regular (≥75%)</span>
              <span className="font-bold text-emerald-700">76%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Irregular (50-74%)</span>
              <span className="font-bold text-amber-700">14%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Low Attendance (&lt;50%)</span>
              <span className="font-bold text-red-700">6%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#37474F]">Discontinued</span>
              <span className="font-bold text-gray-400">4%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
