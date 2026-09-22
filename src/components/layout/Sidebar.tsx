"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  PhoneCall,
  HeartHandshake,
  MessageSquare,
  CalendarClock,
  Sparkles,
  GraduationCap,
  CalendarDays,
  TableProperties,
  Scroll,
  CircleDot,
  Compass,
  UserCog,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  onOpenAddPerson?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAddPerson }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isCoordinator, isAdmin, isCallingVolunteer, isRelationshipVolunteer } = useAuth();

  const getNavGroups = () => {
    if (isCallingVolunteer) {
      return [
        {
          groupTitle: "My Calling Sewa",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Today's Work", href: "/todays-work", icon: CheckSquare },
            { name: "Calling Sewa Desk", href: "/calling-sewa", icon: PhoneCall },
            { name: "My Follow-ups", href: "/followups", icon: CalendarClock },
            { name: "WhatsApp Messages", href: "/whatsapp", icon: MessageSquare },
          ],
        },
      ];
    }

    if (isRelationshipVolunteer) {
      return [
        {
          groupTitle: "My Devotee Care",
          items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Today's Work", href: "/todays-work", icon: CheckSquare },
            { name: "Relationship Calling", href: "/relationship-calling", icon: HeartHandshake },
            { name: "My Follow-ups", href: "/followups", icon: CalendarClock },
          ],
        },
        {
          groupTitle: "Courses & Sadhana",
          items: [
            { name: "Courses & Batches", href: "/courses", icon: GraduationCap },
            { name: "Attendance Matrix", href: "/attendance", icon: TableProperties },
            { name: "Japa / Mala Tracker", href: "/japa", icon: CircleDot },
            { name: "Spiritual Journey", href: "/spiritual-journey", icon: Scroll },
            { name: "WhatsApp Outreach", href: "/whatsapp", icon: MessageSquare },
          ],
        },
      ];
    }

    return [
      {
        groupTitle: "Core Operations",
        items: [
          { name: "Dashboard", href: "/", icon: LayoutDashboard },
          { name: "People (Master DB)", href: "/people", icon: Users },
          { name: "Today's Work", href: "/todays-work", icon: CheckSquare },
          { name: "Calling Sewa", href: "/calling-sewa", icon: PhoneCall },
          { name: "Relationship Calling", href: "/relationship-calling", icon: HeartHandshake },
          { name: "Follow-ups", href: "/followups", icon: CalendarClock },
        ],
      },
      {
        groupTitle: "Outreach & Learning",
        items: [
          { name: "WhatsApp Studio", href: "/whatsapp", icon: MessageSquare },
          { name: "Programs & Events", href: "/programs", icon: CalendarDays },
          { name: "Courses & Batches", href: "/courses", icon: GraduationCap },
          { name: "Attendance Matrix", href: "/attendance", icon: TableProperties },
        ],
      },
      {
        groupTitle: "Spiritual Sadhana",
        items: [
          { name: "Spiritual Journey", href: "/spiritual-journey", icon: Scroll },
          { name: "Japa / Mala Tracker", href: "/japa", icon: CircleDot },
          { name: "Yatra & Activities", href: "/yatra", icon: Compass },
        ],
      },
      {
        groupTitle: "Administration",
        items: [
          { name: "Team & Volunteers", href: "/volunteers", icon: UserCog },
          { name: "Reports & Analytics", href: "/reports", icon: BarChart3 },
          { name: "Settings", href: "/settings", icon: Sliders },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#FAF8F5]/85 backdrop-blur-xl border-r border-[#E5D8B8] z-30 transition-all duration-300 flex flex-col shadow-lg shadow-[#08415C]/5 ${
        collapsed ? "w-20" : "w-64 sm:w-72"
      }`}
    >
      <div className="p-3.5 sm:p-4 border-b border-[#E5D8B8]/80 flex items-center justify-between bg-white/40 backdrop-blur-md">

        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5D8B8] p-1 shadow-sm flex items-center justify-center flex-shrink-0">
            <img
              src="/icons/iskcon-ahmedabad-logo.svg"
              alt="ISKCON Ahmedabad Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <h1 className="font-serif font-bold text-sm text-[#08415C] tracking-tight flex items-center gap-1">
                <span>ISKCON</span>
                <span className="text-[#D4AF37]">•</span>
                <span className="text-xs font-semibold text-stone-700">Chandkheda</span>
              </h1>
              <span className="text-[10px] font-bold text-[#B8860B] tracking-wider uppercase block mt-0.5">
                Sri Sri Radha Govind Seva
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg border border-[#E5D8B8] bg-white text-[#78909C] hover:text-[#08415C] transition"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && onOpenAddPerson && (isCoordinator || isCallingVolunteer) && (
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onOpenAddPerson}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-[#08415C] text-[#08415C] hover:text-white border-2 border-dashed border-[#D4AF37] rounded-xl font-semibold text-xs transition duration-200 shadow-sm group"
          >
            <Plus className="w-4 h-4 text-[#D4AF37] group-hover:rotate-90 transition-transform duration-200" />
            <span>Add New Seeker</span>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 scrollbar-thin">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#78909C]">
                {group.groupTitle}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? "bg-[#08415C] text-white shadow-sm"
                      : "text-[#455A64] hover:bg-[#08415C]/10 hover:text-[#08415C]"
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? "text-[#D4AF37]" : "text-[#78909C] group-hover:text-[#08415C]"
                    }`}
                  />
                  {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#E5D8B8]/80 bg-white/40 backdrop-blur-md">
        <div className="p-2.5 rounded-xl bg-white/90 backdrop-blur-sm border border-[#E5D8B8] flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-[#08415C] text-white flex items-center justify-center border border-[#D4AF37] flex-shrink-0">
            <User className="w-4 h-4 text-[#D4AF37]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#0B192C] truncate">{user?.name}</div>
              <div className="text-[10px] text-stone-500 truncate capitalize">
                {user?.role?.toLowerCase().replace(/_/g, " ")}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
