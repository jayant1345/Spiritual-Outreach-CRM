import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "xl",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#08415C]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#FFFFFF] border border-[#E5D8B8] rounded-2xl shadow-gold-lg overflow-hidden transform transition-all z-10 my-8`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#E5D8B8]/70 bg-[#FAF8F5]">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif text-[#08415C] font-semibold flex items-center gap-2">
              <span className="text-[#D4AF37]">🪷</span> {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#37474F] mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#78909C] hover:text-[#08415C] hover:bg-[#F5F1EB] p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
