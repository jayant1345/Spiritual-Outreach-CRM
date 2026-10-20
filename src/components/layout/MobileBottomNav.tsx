"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PhoneCall,
  CalendarCheck,
  Users,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
  onOpenMobileMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const pathname = usePathname();
  const { user, isAdmin, isTeamLeader, isCoordinator } = useAuth();

  const role = user?.role;
  const canViewMembers =
    isAdmin ||
    isTeamLeader ||
    isCoordinator ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "TEAM_LEADER" ||
    role === "COORDINATOR";

  const canViewCourses =
    isAdmin ||
    isTeamLeader ||
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "TEAM_LEADER";

  // Navigation Items per Admin Requirements:
  // 1. HOME [ FOR ALL USER ]
  // 2. CALLING [ FOR ALL USER ]
  // 3. ATTENDANCE [ FOR ALL USER ]
  // 4. MEMBERS [ ADMIN & TL & COORDINATOR ]
  // 5. COURSE [ ADMIN & TEAM LEADER ]
  // NOTE: Bottom MENU button removed as Hamburger Menu is already present in top-left.
  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      label: "Calling",
      href: "/calling-sewa",
      icon: PhoneCall,
      isActive: pathname === "/calling-sewa" || pathname === "/todays-work",
    },
    {
      label: "Attendance",
      href: "/attendance",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/attendance"),
    },
    ...(canViewMembers
      ? [
          {
            label: "Members",
            href: "/people",
            icon: Users,
            isActive: pathname.startsWith("/people"),
          },
        ]
      : []),
    ...(canViewCourses
      ? [
          {
            label: "Course",
            href: "/courses",
            icon: GraduationCap,
            isActive: pathname.startsWith("/courses"),
          },
        ]
      : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#FAF8F5]/95 backdrop-blur-xl border-t border-[#E5D8B8] shadow-[0_-4px_20px_rgba(8,65,92,0.08)] px-1 py-1.5 safe-area-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition duration-150 relative min-w-[50px] flex-1 max-w-[76px] ${
                item.isActive
                  ? "text-[#08415C]"
                  : "text-[#78909C] hover:text-[#08415C]"
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  item.isActive
                    ? "bg-[#08415C] text-[#D4AF37] shadow-xs"
                    : "text-stone-500"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium leading-none truncate max-w-full ${
                  item.isActive
                    ? "font-bold text-[#08415C]"
                    : "text-stone-500"
                }`}
              >
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1 h-1 rounded-full bg-[#D4AF37] absolute -bottom-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
