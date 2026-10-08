"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  GraduationCap,
  Menu,
} from "lucide-react";

interface MobileBottomNavProps {
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMobileMenu }) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      label: "Members",
      href: "/people",
      icon: Users,
      isActive: pathname === "/people",
    },
    {
      label: "Calling",
      href: "/calling-sewa",
      icon: PhoneCall,
      isActive: pathname === "/calling-sewa" || pathname === "/todays-work",
    },
    {
      label: "Courses",
      href: "/courses",
      icon: GraduationCap,
      isActive: pathname.startsWith("/courses") || pathname === "/attendance",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#FAF8F5]/95 backdrop-blur-xl border-t border-[#E5D8B8] shadow-[0_-4px_20px_rgba(8,65,92,0.08)] px-2 py-1.5 safe-area-bottom"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition duration-150 relative min-w-[56px] ${
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
                className={`text-[10px] mt-0.5 font-medium leading-none ${
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

        {/* More Menu Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#78909C] hover:text-[#08415C] transition duration-150 min-w-[56px]"
          aria-label="Open More Options"
        >
          <div className="p-1 rounded-lg text-stone-500">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-medium text-stone-500 leading-none">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
