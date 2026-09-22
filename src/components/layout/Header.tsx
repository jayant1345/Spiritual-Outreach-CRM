"use client";

import React, { useState } from "react";
import { Search, Plus, Bell, MapPin, User, LogOut, ChevronDown, Shield, PhoneCall, HeartHandshake, CheckCircle2, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onOpenAddPerson?: () => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddPerson,
  onSearchChange,
  searchQuery = "",
  onOpenMobileMenu,
}) => {
  const { user, logout, switchDemoUser } = useAuth();
  const [activeCenter, setActiveCenter] = useState("Chandkheda Center");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { label: "Admin", bg: "bg-[#08415C]", text: "text-white", border: "border-[#D4AF37]" };
      case "COORDINATOR":
        return { label: "Coordinator", bg: "bg-emerald-700", text: "text-white", border: "border-emerald-500" };
      case "CALLING_VOLUNTEER":
        return { label: "Caller", bg: "bg-blue-600", text: "text-white", border: "border-blue-400" };
      case "RELATIONSHIP_VOLUNTEER":
        return { label: "Counselor", bg: "bg-amber-600", text: "text-white", border: "border-amber-400" };
      default:
        return { label: "Volunteer", bg: "bg-stone-600", text: "text-white", border: "border-stone-400" };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-20 h-16 bg-[#FAF8F5]/85 backdrop-blur-xl border-b border-[#E5D8B8] px-3 sm:px-8 flex items-center justify-between gap-2.5 sm:gap-4 shadow-sm shadow-[#08415C]/5">
      {/* Mobile Hamburger Drawer Trigger */}
      {onOpenMobileMenu && (
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-white border border-[#E5D8B8] text-[#08415C] hover:bg-[#08415C]/10 transition shadow-xs flex items-center justify-center flex-shrink-0"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-[#08415C]" />
        </button>
      )}

      <div className="flex-1 max-w-xl relative min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78909C]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Search Name, Phone, Locality..."
          className="w-full pl-9 sm:pl-10 pr-4 sm:pr-12 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs sm:text-sm text-[#0B192C] placeholder-[#78909C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C] shadow-sm transition truncate"
        />
        <span className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#78909C] bg-[#FAF8F5] border border-[#E5D8B8] px-1.5 py-0.5 rounded">
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs font-semibold text-[#08415C] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{activeCenter}</span>
        </div>

        {onOpenAddPerson && (
          <button
            onClick={onOpenAddPerson}
            className="px-3.5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">Add Seeker</span>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-white border border-[#E5D8B8] rounded-xl hover:border-[#08415C] transition shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-[#08415C] text-white flex items-center justify-center border border-[#D4AF37]">
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="text-xs font-bold text-[#0B192C] leading-none">{user?.name || "Guest"}</div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-stone-100">
                <div className="text-xs font-bold text-stone-900">{user?.name}</div>
                <div className="text-[11px] text-stone-500 truncate">{user?.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}>
                    Role: {badge.label}
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-stone-100 bg-stone-50">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  Switch Role (Demo Mode)
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-left">
                  <button
                    onClick={() => { switchDemoUser('SUPER_ADMIN'); setIsProfileOpen(false); }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border text-left flex items-center gap-1 ${user?.role === 'SUPER_ADMIN' ? 'bg-[#08415C] text-white border-[#08415C]' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                  >
                    <Shield className="w-3 h-3 text-[#D4AF37]" /> Admin
                  </button>
                  <button
                    onClick={() => { switchDemoUser('COORDINATOR'); setIsProfileOpen(false); }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border text-left flex items-center gap-1 ${user?.role === 'COORDINATOR' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Coord
                  </button>
                  <button
                    onClick={() => { switchDemoUser('CALLING_VOLUNTEER'); setIsProfileOpen(false); }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border text-left flex items-center gap-1 ${user?.role === 'CALLING_VOLUNTEER' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                  >
                    <PhoneCall className="w-3 h-3 text-blue-300" /> Caller
                  </button>
                  <button
                    onClick={() => { switchDemoUser('RELATIONSHIP_VOLUNTEER'); setIsProfileOpen(false); }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg border text-left flex items-center gap-1 ${user?.role === 'RELATIONSHIP_VOLUNTEER' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                  >
                    <HeartHandshake className="w-3 h-3 text-amber-300" /> Counselor
                  </button>
                </div>
              </div>

              <div className="pt-1.5 px-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out of Sewa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
