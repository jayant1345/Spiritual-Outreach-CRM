"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import { CalendarClock, CheckCircle2, PhoneCall, MessageSquare, Calendar } from "lucide-react";

export default function FollowupsPage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, refreshTrigger } = useContext(CRMContext);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/followups?status=ALL");
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <CalendarClock className="w-6 h-6 text-[#D4AF37]" />
          Follow-up Tasks Board
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Comprehensive follow-up tracking across calling campaigns, WhatsApp reminders, and devotee check-ins
        </p>
      </div>

      <div className="gold-card p-5 space-y-3">
        <div className="divide-y divide-[#E5D8B8]/60">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] px-2 rounded-xl transition"
            >
              <div
                className="cursor-pointer"
                onClick={() => openPersonModal(task.person.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-[#08415C]">
                    {task.person.fullName}
                  </span>
                  <Badge variant={task.status === "COMPLETED" ? "emerald" : "gold"}>
                    {task.status}
                  </Badge>
                  <span className="text-xs text-[#78909C]">Due: {new Date(task.dueDate).toLocaleDateString("en-IN")}</span>
                </div>
                <p className="text-xs text-[#37474F] mt-1">{task.remarks || "Follow-up needed."}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openCallModal(task.person)}
                  className="px-3 py-1.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call
                </button>
                <button
                  onClick={() => openWhatsAppModal(task.person)}
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
