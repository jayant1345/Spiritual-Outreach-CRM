"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface BatchItem {
  id: string;
  batchName: string;
  scheduleInfo?: string | null;
  active: boolean;
  startDate?: string;
  _count?: {
    enrollments?: number;
  };
  enrollments?: any[];
}

export interface CourseItem {
  id: string;
  title: string;
  courseType: string;
  facultyName?: string | null;
  venue?: string | null;
  startDate: string;
  status: string;
  description?: string | null;
  batches: BatchItem[];
  stats?: {
    totalStudents: number;
    regularCount: number;
    irregularCount: number;
    lowCount: number;
  };
}

interface WorkspaceContextType {
  selectedCourseId: string; // "ALL" or specific Course ID
  selectedBatchIds: string[]; // empty means all batches of the selected course
  courses: CourseItem[];
  loadingCourses: boolean;
  selectedCourse: CourseItem | null;
  setWorkspace: (courseId: string, batchIds: string[]) => void;
  resetWorkspace: () => void;
  isBatchSelected: (batchId: string) => boolean;
  toggleBatch: (batchId: string) => void;
  selectAllBatchesForCourse: (courseId?: string) => void;
  activeCourseTitle: string;
  activeBatchSummary: string;
  refreshCourses: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_COURSE_KEY = "chandkheda_workspace_course_id";
const STORAGE_BATCHES_KEY = "chandkheda_workspace_batch_ids";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Load courses from API
  const refreshCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCourses(data);
        }
      }
    } catch (err) {
      console.error("Failed to load courses for workspace:", err);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // Load initial selection from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCourseId = localStorage.getItem(STORAGE_COURSE_KEY);
      const savedBatchIds = localStorage.getItem(STORAGE_BATCHES_KEY);
      if (savedCourseId) {
        setSelectedCourseId(savedCourseId);
      }
      if (savedBatchIds) {
        try {
          const parsed = JSON.parse(savedBatchIds);
          if (Array.isArray(parsed)) setSelectedBatchIds(parsed);
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  const setWorkspace = useCallback((courseId: string, batchIds: string[]) => {
    setSelectedCourseId(courseId);
    setSelectedBatchIds(batchIds);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_COURSE_KEY, courseId);
      localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(batchIds));
    }
  }, []);

  const resetWorkspace = useCallback(() => {
    setSelectedCourseId("ALL");
    setSelectedBatchIds([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_COURSE_KEY);
      localStorage.removeItem(STORAGE_BATCHES_KEY);
    }
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const isBatchSelected = useCallback(
    (batchId: string) => {
      // If batch list is empty and course is selected, all batches of that course are selected by default
      if (selectedBatchIds.length === 0) return true;
      return selectedBatchIds.includes(batchId);
    },
    [selectedBatchIds]
  );

  const toggleBatch = useCallback((batchId: string) => {
    setSelectedBatchIds((prev) => {
      let next: string[];
      if (prev.includes(batchId)) {
        next = prev.filter((id) => id !== batchId);
      } else {
        next = [...prev, batchId];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const selectAllBatchesForCourse = useCallback(
    (courseId?: string) => {
      const targetCourseId = courseId || selectedCourseId;
      const targetCourse = courses.find((c) => c.id === targetCourseId);
      if (!targetCourse) return;
      const allBatchIds = targetCourse.batches.map((b) => b.id);
      setSelectedBatchIds(allBatchIds);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_BATCHES_KEY, JSON.stringify(allBatchIds));
      }
    },
    [courses, selectedCourseId]
  );

  const activeCourseTitle =
    selectedCourseId === "ALL" ? "All Courses (Center Overview)" : selectedCourse?.title || "Selected Course";

  let activeBatchSummary = "All Batches";
  if (selectedCourseId !== "ALL" && selectedCourse) {
    if (selectedBatchIds.length === 0 || selectedBatchIds.length === selectedCourse.batches.length) {
      activeBatchSummary = `All Batches (${selectedCourse.batches.length})`;
    } else {
      const names = selectedCourse.batches
        .filter((b) => selectedBatchIds.includes(b.id))
        .map((b) => b.batchName);
      activeBatchSummary = names.length > 0 ? names.join(", ") : "None Selected";
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{
        selectedCourseId,
        selectedBatchIds,
        courses,
        loadingCourses,
        selectedCourse,
        setWorkspace,
        resetWorkspace,
        isBatchSelected,
        toggleBatch,
        selectAllBatchesForCourse,
        activeCourseTitle,
        activeBatchSummary,
        refreshCourses,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
