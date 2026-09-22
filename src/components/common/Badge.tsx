import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "morpankh" | "gold" | "emerald" | "amber" | "red" | "neutral" | "saffron";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "morpankh",
  size = "sm",
  className = "",
  icon,
}) => {
  const variantStyles = {
    morpankh: "bg-[#08415C]/10 text-[#08415C] border-[#08415C]/25",
    gold: "bg-[#FAF5E6] text-[#B8860B] border-[#D4AF37]/40",
    emerald: "bg-[#E6F6F4] text-[#00A896] border-[#00A896]/30",
    amber: "bg-amber-50 text-amber-700 border-amber-300",
    red: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-[#F5F1EB] text-[#37474F] border-[#E2D9C8]",
    saffron: "bg-[#FDF2EC] text-[#D9480F] border-[#D9480F]/30",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded-full",
    md: "px-2.5 py-1 text-xs font-semibold rounded-full",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="text-[10px]">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
