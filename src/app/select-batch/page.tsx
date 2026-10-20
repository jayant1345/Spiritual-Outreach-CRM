"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace, CourseItem, BatchItem } from "@/contexts/WorkspaceContext";
import {
  GraduationCap,
  Layers,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Calendar,
  Users,
  Compass,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function SelectBatchPage() {
  const router = useRouter();
  const { user, loading: authLoading, isCallingVolunteer, isCoordinator, isAdmin } = useAuth();
  const { courses, loadingCourses, setWorkspace, selectedCourseId, selectedBatchIds } = useWorkspace();

  const [step, setStep] = useState<"course" | "batch">("course");
  const [chosenCourseId, setChosenCourseId] = useState<string>("ALL");
  const [chosenBatchIds, setChosenBatchIds] = useState<string[]>([]);
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false);

  // If user has only 1 batch assigned across all courses, auto-select and proceed
  useEffect(() => {
    if (!loadingCourses && courses.length > 0 && !isAdmin) {
      const allBatches = courses.flatMap((c) => c.batches);
      if (allBatches.length === 1) {
        setAutoRedirecting(true);
        const singleBatch = allBatches[0];
        const parentCourse = courses.find((c) => c.batches.some((b) => b.id === singleBatch.id));
        setWorkspace(parentCourse?.id || "ALL", [singleBatch.id]);
        setTimeout(() => {
          if (isCallingVolunteer) {
            router.push("/calling-sewa");
          } else {
            router.push("/");
          }
        }, 800);
      }
    }
  }, [loadingCourses, courses, isCallingVolunteer, isAdmin, setWorkspace, router]);

  const chosenCourse = courses.find((c) => c.id === chosenCourseId);
  const courseBatches = chosenCourse?.batches || [];

  const handleSelectCourse = (courseId: string) => {
    setChosenCourseId(courseId);
    if (courseId === "ALL") {
      // Center Overview: select all batches and proceed directly
      setChosenBatchIds([]);
      setWorkspace("ALL", []);
      router.push("/");
      return;
    }

    const targetCourse = courses.find((c) => c.id === courseId);
    if (targetCourse && targetCourse.batches.length > 0) {
      // Select all batches by default for convenience
      setChosenBatchIds(targetCourse.batches.map((b) => b.id));
      setStep("batch");
    } else {
      setChosenBatchIds([]);
      setWorkspace(courseId, []);
      router.push("/");
    }
  };

  const handleToggleBatch = (batchId: string) => {
    setChosenBatchIds((prev) => {
      if (prev.includes(batchId)) {
        return prev.filter((id) => id !== batchId);
      } else {
        return [...prev, batchId];
      }
    });
  };

  const handleToggleSelectAllBatches = () => {
    if (chosenBatchIds.length === courseBatches.length) {
      // Unselect all
      setChosenBatchIds([]);
    } else {
      // Select all
      setChosenBatchIds(courseBatches.map((b) => b.id));
    }
  };

  const handleProceedToDashboard = () => {
    setWorkspace(chosenCourseId, chosenBatchIds);
    router.push("/");
  };

  if (authLoading || loadingCourses || autoRedirecting) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#08415C] border-2 border-[#D4AF37] flex items-center justify-center animate-pulse mb-3 shadow-xl">
          <span className="text-[#D4AF37] font-bold text-2xl">🪷</span>
        </div>
        <p className="text-base font-semibold text-[#08415C]">
          {autoRedirecting
            ? "Assigned single batch detected. Opening your workspace..."
            : "Loading Course & Batch Workspace..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] relative overflow-hidden flex flex-col justify-between py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      {/* Sacred Watermark Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/radha-govind-watermark.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          opacity: 0.12,
        }}
      />

      <div className="max-w-4xl w-full mx-auto relative z-10 space-y-6 sm:space-y-8">
        {/* Top Header / Brand Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5E6] border border-[#E5D8B8] text-[#B8860B] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>🪷 ISKCON Chandkheda</span>
            <span>•</span>
            <span>Devotee Care CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C]">
            Select Course & Batch Workspace
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl mx-auto">
            Welcome, <strong>{user?.name}</strong> ({user?.role || "Devotee"}). Choose your active spiritual course and batches to automatically filter your outreach dashboard.
          </p>

          {/* Stepper Indicator */}
          <div className="mt-5 flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
            <button
              onClick={() => setStep("course")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all ${
                step === "course"
                  ? "bg-[#08415C] text-white shadow-md shadow-[#08415C]/20"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-[#08415C]"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Step 2: Select Course</span>
            </button>

            <ChevronRight className="w-4 h-4 text-stone-400" />

            <button
              disabled={chosenCourseId === "ALL" && step === "course"}
              onClick={() => {
                if (chosenCourseId !== "ALL") setStep("batch");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all ${
                step === "batch"
                  ? "bg-[#08415C] text-white shadow-md shadow-[#08415C]/20"
                  : "bg-white text-stone-600 border border-stone-200 disabled:opacity-50"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Step 3: Select Batch</span>
            </button>
          </div>
        </div>

        {/* STEP 2: SELECT COURSE SCREEN */}
        {step === "course" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#08415C]" />
                  <span>Choose Your Course</span>
                </h2>
                <p className="text-xs text-stone-500">
                  Select the spiritual course you are guiding or managing today.
                </p>
              </div>

              {/* Master Overview option for Admins */}
              <button
                type="button"
                onClick={() => handleSelectCourse("ALL")}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D4AF37] text-[#08415C] rounded-xl text-xs font-semibold hover:bg-[#FAF5E6] transition shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                <span>Center Master (All Courses)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Option 1: All Center Courses Card */}
              <div
                onClick={() => handleSelectCourse("ALL")}
                className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 border-dashed border-[#D4AF37] hover:border-[#08415C] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FAF5E6] text-[#B8860B] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#08415C] group-hover:text-[#B8860B] transition-colors">
                    All Courses & Center Overview
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Complete master view across all JOSD, Gita, Bhakti Vriksha, and youth batches.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#08415C]">
                  <span>Center-wide Cockpit</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Dynamic Course Cards */}
              {courses.map((course) => {
                const isSelected = chosenCourseId === course.id;
                const totalStudents = course.stats?.totalStudents || 0;
                const batchesCount = course.batches.length;

                return (
                  <div
                    key={course.id}
                    onClick={() => handleSelectCourse(course.id)}
                    className={`bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between group relative shadow-xs hover:shadow-xl ${
                      isSelected
                        ? "border-[#08415C] ring-2 ring-[#08415C]/20"
                        : "border-[#E5D8B8] hover:border-[#08415C]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#08415C]/10 text-[#08415C] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                          {course.courseType || "Spiritual Course"}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#08415C] transition-colors leading-tight">
                        {course.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {course.description || "Comprehensive spiritual curriculum with batch calling and attendance tracking."}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#B8860B]" />
                          <span><strong>{batchesCount}</strong> {batchesCount === 1 ? "Batch" : "Batches"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#00A896]" />
                          <span><strong>{totalStudents}</strong> Devotees</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold text-[#08415C]">
                        <span>Select Batches</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: SELECT BATCH SCREEN */}
        {step === "batch" && chosenCourse && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header with Back Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#E5D8B8] shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("course")}
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  title="Back to Course selection"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B8860B]">
                    Selected Course
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#08415C]">
                    {chosenCourse.title}
                  </h2>
                </div>
              </div>

              {/* Select All Batches Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSelectAllBatches}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition self-start sm:self-auto bg-stone-50 border-stone-300 hover:bg-stone-100 text-stone-800"
              >
                {chosenBatchIds.length === courseBatches.length && courseBatches.length > 0 ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-[#08415C]" />
                    <span>All Batches Selected</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-stone-400" />
                    <span>Select All Batches</span>
                  </>
                )}
              </button>
            </div>

            {/* Batch Selection Cards with Checkboxes */}
            <div className="space-y-2.5">
              <p className="text-xs text-stone-500 font-medium px-1">
                Select one or multiple batches below to monitor and assign calls:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courseBatches.map((batch: BatchItem) => {
                  const isChecked = chosenBatchIds.includes(batch.id);
                  const enrolledCount = batch.enrollments?.length || batch._count?.enrollments || 0;

                  return (
                    <div
                      key={batch.id}
                      onClick={() => handleToggleBatch(batch.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 bg-white/95 backdrop-blur-md shadow-xs hover:shadow-md ${
                        isChecked
                          ? "border-[#08415C] bg-[#FAF8F5]/80 ring-2 ring-[#08415C]/15"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="pt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-[#08415C]" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-stone-900 truncate">
                            {batch.batchName}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{batch.scheduleInfo || "Weekly Seva Schedule"}</span>
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600 font-medium">
                          <span>{enrolledCount} Devotees Enrolled</span>
                          <span className={isChecked ? "text-[#08415C] font-bold" : "text-stone-400"}>
                            {isChecked ? "Included in Workspace" : "Click to include"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {courseBatches.length === 0 && (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
                  No batches configured under this course yet.
                </div>
              )}
            </div>

            {/* Selection Summary and Continue Button */}
            <div className="mt-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#D4AF37] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xs text-stone-500">Workspace Selection:</div>
                <div className="text-sm font-bold text-[#08415C]">
                  {chosenBatchIds.length === 0
                    ? "All batches included by default"
                    : `${chosenBatchIds.length} of ${courseBatches.length} Batches Selected`}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Dashboard metrics, calling desk, and volunteer reports will automatically focus on this selection.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStep("course")}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition w-full sm:w-auto"
                >
                  Change Course
                </button>

                <button
                  type="button"
                  onClick={handleProceedToDashboard}
                  className="px-6 py-2.5 rounded-xl bg-[#08415C] text-white text-xs font-semibold hover:bg-[#063349] transition shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <span>Proceed to Dashboard (Step 4)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Helpful Footer Note */}
        <div className="text-center text-xs text-stone-500 pt-4 border-t border-[#E5D8B8]/60">
          💡 You can quickly switch courses and batches anytime using the switcher in the top navigation bar without logging out.
        </div>
      </div>
    </div>
  );
}
