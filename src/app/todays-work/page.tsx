"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import {
  CheckSquare,
  PhoneCall,
  MessageSquare,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function TodaysWorkPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED">("PENDING");

  useEffect(() => {
    fetchFollowups();
  }, [refreshTrigger, filterStatus]);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/followups?status=${filterStatus}`);
      const data = await res.json();
      setFollowups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading followups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await fetch("/api/followups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "COMPLETED" }),
      });
      fetchFollowups();
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
            <CheckSquare className="w-6 h-6 text-[#D4AF37]" />
            Today&apos;s Work & Action Center
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Personalized daily tasks: Pending calls, callbacks, absent follow-ups, and scheduled check-ins
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold shadow-sm">
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "PENDING"
                ? "bg-[#08415C] text-white shadow-sm"
                : "text-[#37474F] hover:bg-[#FAF8F5]"
            }`}
          >
            Pending Tasks ({followups.filter((f) => f.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "COMPLETED"
                ? "bg-[#08415C] text-white shadow-sm"
                : "text-[#37474F] hover:bg-[#FAF8F5]"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === "ALL"
                ? "bg-[#08415C] text-white shadow-sm"
                : "text-[#37474F] hover:bg-[#FAF8F5]"
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Follow-up Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-[#78909C]">
            <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
            <p>Loading Today&apos;s Outreach Tasks...</p>
          </div>
        ) : followups.length === 0 ? (
          <div className="col-span-full gold-card p-12 text-center text-xs text-[#78909C]">
            <CheckCircle2 className="w-10 h-10 text-[#00A896] mx-auto mb-2" />
            <h4 className="font-serif font-bold text-base text-[#08415C]">
              All Follow-ups Cleared for Today!
            </h4>
            <p className="mt-1">Wonderful seva! No pending tasks remaining in your queue.</p>
          </div>
        ) : (
          followups.map((task) => (
            <div
              key={task.id}
              className={`gold-card p-4 space-y-3 flex flex-col justify-between ${
                task.priority === "URGENT" ? "border-l-4 border-l-red-500" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <Badge variant={task.priority === "URGENT" ? "red" : "gold"}>
                    {task.priority} Priority
                  </Badge>
                  <span className="text-[11px] text-[#78909C] flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-[#D4AF37]" />
                    Due: {new Date(task.dueDate).toLocaleDateString("en-IN")}
                  </span>
                </div>

                <div
                  className="cursor-pointer group"
                  onClick={() => openPersonModal(task.person.id)}
                >
                  <h4 className="font-serif font-bold text-base text-[#08415C] group-hover:text-[#0B4F6C]">
                    {task.person.fullName}
                  </h4>
                  <p className="text-xs text-[#78909C]">
                    +91 {task.person.mobile} • {task.person.area || "Chandkheda"}
                  </p>
                </div>

                <p className="text-xs text-[#37474F] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E5D8B8] mt-2.5 leading-relaxed">
                  {task.remarks || "Follow-up required with devotee."}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-[#E5D8B8]/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openCallModal(task.person)}
                    className="px-2.5 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 transition"
                  >
                    <PhoneCall className="w-3 h-3" /> Call
                  </button>
                  <button
                    onClick={() => openWhatsAppModal(task.person)}
                    className="px-2.5 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1 transition"
                  >
                    <MessageSquare className="w-3 h-3 text-[#D4AF37]" /> WhatsApp
                  </button>
                </div>

                {task.status === "PENDING" && (
                  <button
                    onClick={() => handleMarkComplete(task.id)}
                    className="p-1.5 text-xs text-[#00A896] hover:bg-emerald-50 rounded-lg transition font-semibold"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
