"use client";

import React from "react";
import Link from "next/link";
import Badge from "@/components/common/Badge";
import { Scroll, Sparkles, Compass, BookOpen, GraduationCap } from "lucide-react";

export default function SpiritualJourneyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
          <Scroll className="w-6 h-6 text-[#D4AF37]" />
          Spiritual Journey & Sadhana Milestones
        </h2>
        <p className="text-xs text-[#78909C] mt-0.5">
          Visualizing the spiritual growth of devotees from first book distribution contact to steady chanting and course graduation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="gold-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center text-xl font-bold">
            📿
          </div>
          <h3 className="font-serif font-bold text-lg text-[#08415C]">
            Japa Sadhana Tracking
          </h3>
          <p className="text-xs text-[#78909C] leading-relaxed">
            Record voluntary round targets (4, 8, 16 rounds) and track consistency over time.
          </p>
          <Link
            href="/japa"
            className="inline-block text-xs font-semibold text-[#08415C] hover:text-[#B8860B] pt-2"
          >
            Open Japa Tracker →
          </Link>
        </div>

        <div className="gold-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00A896] flex items-center justify-center text-xl font-bold">
            📖
          </div>
          <h3 className="font-serif font-bold text-lg text-[#08415C]">
            Sacred Literature & Books
          </h3>
          <p className="text-xs text-[#78909C] leading-relaxed">
            Track books distributed (Bhagavad Gita As It Is, Srimad Bhagavatam, Science of Self Realization).
          </p>
          <Link
            href="/people"
            className="inline-block text-xs font-semibold text-[#08415C] hover:text-[#B8860B] pt-2"
          >
            View Devotee Profiles →
          </Link>
        </div>

        <div className="gold-card p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#08415C]/10 text-[#08415C] flex items-center justify-center text-xl font-bold">
            🎓
          </div>
          <h3 className="font-serif font-bold text-lg text-[#08415C]">
            Courses & Study Circles
          </h3>
          <p className="text-xs text-[#78909C] leading-relaxed">
            Gita Shiksha course completions, batch regularity formulas, and certifications.
          </p>
          <Link
            href="/courses"
            className="inline-block text-xs font-semibold text-[#08415C] hover:text-[#B8860B] pt-2"
          >
            Open Course Batches →
          </Link>
        </div>
      </div>
    </div>
  );
}
