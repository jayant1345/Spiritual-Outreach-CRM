"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Badge } from "../common/Badge";
import {
  Phone,
  MessageSquare,
  Calendar,
  BookOpen,
  User,
  MapPin,
  Clock,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Plus,
  Trash2,
  Edit3,
  CalendarClock,
  CheckSquare,
  FileText,
  PhoneCall,
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  Camera,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string | null;
  personIdsList?: string[];
  onNavigatePerson?: (newPersonId: string) => void;
  onOpenCallModal: (person: any) => void;
  onOpenWhatsAppModal: (person: any) => void;
  onPersonUpdated?: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  personId,
  personIdsList,
  onNavigatePerson,
  onOpenCallModal,
  onOpenWhatsAppModal,
  onPersonUpdated,
}) => {
  const { hasPermission } = useAuth();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fallbackQueue, setFallbackQueue] = useState<string[]>([]);

  // Priority Accordions State
  const [isFollowupTaskOpen, setIsFollowupTaskOpen] = useState(true);
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isCallingHistoryOpen, setIsCallingHistoryOpen] = useState(false);
  const [isActivityStreamOpen, setIsActivityStreamOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Photo Upload Handler (Click or Upload for existing contact)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !personId) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 360;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);

        try {
          const res = await fetch(`/api/people/${personId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoUrl: compressed }),
          });
          if (res.ok) {
            setSaveFeedback({ type: "success", message: "Devotee photo updated successfully!" });
            setTimeout(() => setSaveFeedback(null), 3000);
            fetchPersonDetails(personId);
            if (onPersonUpdated) onPersonUpdated();
          } else {
            const d = await res.json();
            alert(d.error || "Failed to update photo");
          }
        } catch (err) {
          console.error(err);
          alert("Error updating photo");
        } finally {
          setUploadingPhoto(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Right Side Activity Actions State
  const [activeRightTab, setActiveRightTab] = useState<"log_call" | "add_task" | "add_note">("log_call");
  const [callOutcome, setCallOutcome] = useState("YES_WILL_ATTEND");
  const [callNotes, setCallNotes] = useState("");
  const [callNextDate, setCallNextDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskRemarks, setTaskRemarks] = useState("");
  const [taskType, setTaskType] = useState("Calling");
  const [newNote, setNewNote] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Direct Course & Batch Enrollment State
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [isEnrollingCourse, setIsEnrollingCourse] = useState(false);
  const [selectedEnrollBatchId, setSelectedEnrollBatchId] = useState("");
  const [enrollingLoading, setEnrollingLoading] = useState(false);

  // If no queue is provided externally, fetch people list from API to provide seamless Next/Prev
  useEffect(() => {
    if (isOpen && (!personIdsList || personIdsList.length === 0)) {
      fetch("/api/people")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFallbackQueue(data.map((p: any) => p.id));
          }
        })
        .catch((err) => console.error("Error loading fallback queue:", err));
    }
  }, [isOpen, personIdsList]);

  const queue = personIdsList && personIdsList.length > 0 ? personIdsList : fallbackQueue;
  const currentIndex = personId ? queue.indexOf(personId) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onNavigatePerson) {
      onNavigatePerson(queue[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigatePerson) {
      onNavigatePerson(queue[currentIndex + 1]);
    }
  };

  // Keyboard navigation: Left Arrow (←) for previous, Right Arrow (→) for next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        handleNext();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, hasPrevious, hasNext, currentIndex, queue]);

  const getPersonPhoto = (p: any): string | null => {
    if (!p) return null;
    if (p.photoUrl) return p.photoUrl;
    if (p.customData) {
      try {
        const parsed = typeof p.customData === "string" ? JSON.parse(p.customData) : p.customData;
        return parsed.photoUrl || parsed.photo || null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const getCustomFields = (p: any): { key: string; value: string }[] => {
    if (!p?.customData) return [];
    try {
      const parsed = typeof p.customData === "string" ? JSON.parse(p.customData) : p.customData;
      const result: { key: string; value: string }[] = [];
      Object.entries(parsed).forEach(([k, v]) => {
        if (k !== "photoUrl" && k !== "photo" && k !== "labels" && typeof v === "string" && v.trim()) {
          result.push({ key: k, value: v });
        }
      });
      return result;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (isOpen && personId) {
      fetchPersonDetails(personId);
      fetchCoursesList();
      setIsEditing(false);
      setIsEnrollingCourse(false);
      setSelectedEnrollBatchId("");
    }
  }, [isOpen, personId]);

  const fetchCoursesList = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (Array.isArray(data)) setCoursesList(data);
    } catch (err) {
      console.error("Error loading courses:", err);
    }
  };

  const handleEnrollInBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollBatchId || !personId) return;
    setEnrollingLoading(true);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedEnrollBatchId,
          personId: personId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEnrollingCourse(false);
        setSelectedEnrollBatchId("");
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        alert(data.error || "Enrollment failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollingLoading(false);
    }
  };

  const handleUnenrollFromBatch = async (enrollmentId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to remove ${person?.fullName} from batch "${batchName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/courses/enroll?enrollmentId=${enrollmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPersonDetails(personId!);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPersonDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people/${id}`);
      const data = await res.json();
      setPerson(data);
      setEditFormData({
        fullName: data.fullName,
        mobile: data.mobile,
        whatsappNumber: data.whatsappNumber || data.mobile,
        email: data.email || "",
        area: data.area || "",
        profession: data.profession || "",
        stage: data.stage || "New Member",
        notes: data.notes || "",
        japaDailyRounds: data.japaDailyRounds || 0,
        spiritualMentor: data.spiritualMentor || "",
      });
    } catch (err) {
      console.error("Error loading person details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save edits");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!personId) return;
    if (!confirm(`Are you sure you want to permanently delete ${person?.fullName} from the CRM? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/people/${personId}`, { method: "DELETE" });
      if (res.ok) {
        onClose();
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Log Call Action (Priority 2 Workflow)
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !callNotes.trim()) return;

    setActionSubmitting(true);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          callType: "Follow-up Call",
          outcome: callOutcome,
          notes: callNotes,
          scheduleFollowup: !!callNextDate,
          followUpDate: callNextDate || null,
        }),
      });

      if (res.ok) {
        setCallNotes("");
        setCallNextDate("");
        setSaveFeedback({ type: "success", message: "Call activity saved successfully!" });
        setTimeout(() => setSaveFeedback(null), 3500);
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        setSaveFeedback({ type: "error", message: d.error || "Failed to save call activity." });
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setSaveFeedback({ type: "error", message: "Failed to record call activity. Notes are preserved." });
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Quick Add Follow-up Task Action
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !taskDueDate) return;

    setActionSubmitting(true);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          dueDate: taskDueDate,
          type: taskType,
          remarks: taskRemarks,
        }),
      });

      if (res.ok) {
        setTaskRemarks("");
        setTaskDueDate("");
        setSaveFeedback({ type: "success", message: "Follow-up task created successfully!" });
        setTimeout(() => setSaveFeedback(null), 3500);
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        setSaveFeedback({ type: "error", message: d.error || "Failed to create follow-up task." });
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setSaveFeedback({ type: "error", message: "Failed to create task." });
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Quick Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !newNote.trim()) return;

    setActionSubmitting(true);
    try {
      const res = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: person.notes ? `${person.notes}\n[${new Date().toLocaleDateString("en-IN")}]: ${newNote}` : newNote,
        }),
      });

      if (res.ok) {
        setNewNote("");
        setSaveFeedback({ type: "success", message: "Note appended to devotee dossier!" });
        setTimeout(() => setSaveFeedback(null), 3500);
        fetchPersonDetails(personId);
        if (onPersonUpdated) onPersonUpdated();
      } else {
        const d = await res.json();
        setSaveFeedback({ type: "error", message: d.error || "Failed to add note." });
        setTimeout(() => setSaveFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setSaveFeedback({ type: "error", message: "Failed to add note." });
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        setSaveFeedback({ type: "success", message: "Follow-up marked as completed!" });
        setTimeout(() => setSaveFeedback(null), 3000);
        fetchPersonDetails(personId!);
        if (onPersonUpdated) onPersonUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !personId) return null;

  const lastCall = person?.callLogs && person.callLogs.length > 0 ? person.callLogs[0] : null;
  const pendingTasks = person?.followupTasks?.filter((t: any) => t.status === "PENDING") || [];
  const nextFollowup = pendingTasks.length > 0 ? pendingTasks[0] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={person ? person.fullName : "Member Profile"}
      subtitle={person ? `360° Devotee Journey Dossier • ${person.area || "Chandkheda"}` : "Loading 360° Profile..."}
      maxWidth="4xl"
      headerAction={
        queue.length > 1 ? (
          <div className="flex items-center gap-1 bg-white border border-[#E5D8B8] rounded-xl p-1 shadow-2xs mr-1">
            <button
              type="button"
              disabled={!hasPrevious}
              onClick={handlePrevious}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg text-stone-700 hover:text-[#08415C] hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold"
              title="Previous Contact (←)"
            >
              <ChevronLeft className="w-4 h-4 text-[#08415C]" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <span className="text-[11px] font-mono font-bold text-stone-600 px-1.5 select-none">
              {currentIndex >= 0 ? currentIndex + 1 : 1}/{queue.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={handleNext}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-[#08415C] hover:bg-[#0B4F6C] text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 text-xs font-bold shadow-2xs"
              title="Next Contact (→)"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>
        ) : null
      }
    >
      {loading || !person ? (
        <div className="py-16 text-center text-[#78909C]">
          <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
          <p className="text-xs font-semibold">Loading 360° Member Journey Dossier...</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3.5">
          {/* Instant Activity Save Feedback Banner */}
          {saveFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs ${
                saveFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-rose-50 text-rose-800 border-rose-300"
              }`}
            >
              {saveFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{saveFeedback.message}</span>
            </div>
          )}

          {/* Quick Contact Switcher Banner for Callers */}
          {queue.length > 1 && (
            <div className="bg-gradient-to-r from-[#FAF8F5] via-[#FFFDF7] to-[#FAF8F5] border border-[#E5D8B8] rounded-2xl p-2 px-3 sm:px-4 flex items-center justify-between shadow-2xs">
              <button
                type="button"
                disabled={!hasPrevious}
                onClick={handlePrevious}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-[#08415C] disabled:opacity-35 disabled:cursor-not-allowed font-semibold text-xs transition shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 text-[#08415C]" />
                <span className="hidden sm:inline">Previous Contact</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <div className="flex items-center gap-2 text-stone-700 font-medium text-xs">
                <span className="bg-[#E5D8B8]/30 px-2.5 py-0.5 rounded-full font-bold text-[#08415C] text-xs">
                  Contact {currentIndex >= 0 ? currentIndex + 1 : 1} of {queue.length}
                </span>
                <span className="text-[10px] text-stone-400 hidden md:inline">
                  (Keyboard: ← Prev | Next →)
                </span>
              </div>

              <button
                type="button"
                disabled={!hasNext}
                onClick={handleNext}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#08415C] hover:bg-[#0B4F6C] text-white disabled:opacity-35 disabled:cursor-not-allowed font-semibold text-xs transition shadow-2xs"
              >
                <span className="hidden sm:inline">Next Contact</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          )}

          {/* PRIORITY 1 – ALWAYS VISIBLE: Devotee Profile Header & Primary Actions */}
          <div className="p-3 sm:p-3.5 bg-white border border-[#E5D8B8] rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Devotee Info */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Devotee Avatar with Quick Camera/Upload Overlay */}
                <div className="relative group flex-shrink-0">
                  {getPersonPhoto(person) ? (
                    <img
                      src={getPersonPhoto(person)!}
                      alt={person.fullName}
                      className="w-13 h-13 rounded-full object-cover border-2 border-[#D4AF37]/50 shadow-xs"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-[#08415C] text-[#D4AF37] font-bold text-sm flex items-center justify-center border-2 border-[#D4AF37]/50 shadow-xs select-none">
                      {person.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  )}

                  {/* Camera Upload Button Overlay */}
                  <label
                    htmlFor="person-modal-photo-upload"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#08415C] hover:bg-[#0B4F6C] text-white border-2 border-white flex items-center justify-center cursor-pointer shadow-xs transition"
                    title={uploadingPhoto ? "Uploading..." : "Click to Take or Upload Photo"}
                  >
                    {uploadingPhoto ? (
                      <span className="animate-spin text-[9px]">⌛</span>
                    ) : (
                      <Camera className="w-3 h-3 text-[#D4AF37]" />
                    )}
                    <input
                      id="person-modal-photo-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base sm:text-lg font-serif font-bold text-[#08415C] truncate">
                      {person.fullName}
                    </h4>
                    <Badge variant="morpankh" size="sm">{person.stage || "New Member"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5 flex-wrap">
                    <span className="font-mono font-medium text-stone-700">+91 {person.mobile}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-500 flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 text-[#D4AF37]" /> {person.area || "Chandkheda"}
                    </span>
                  </div>

                  {/* Labels & Tags Badges */}
                  {person.tags && (
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {person.tags
                        .split(",")
                        .map((t: string) => t.trim())
                        .filter((t: string) => t && t !== "Male" && t !== "Female" && t !== "Other")
                        .map((tag: string, idx: number) => {
                          const isLabel = ["Youth", "Chairman", "Senior Citizen", "Life Patron", "Donor", "Volunteer"].includes(tag);
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${
                                isLabel
                                  ? "bg-[#FAF5E6] text-[#08415C] border-[#D4AF37]/60"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {isLabel ? `🏷️ ${tag}` : `🔖 ${tag}`}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Call & WhatsApp (Primary) + Edit + More Options */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap flex-shrink-0 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={() => onOpenCallModal(person)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-[#00A896] hover:bg-[#028090] active:bg-[#007F70] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs min-h-[42px]"
                  title="Dial Call"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenWhatsAppModal(person)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] active:bg-[#063349] text-white text-xs font-bold rounded-xl border border-[#D4AF37]/50 flex items-center justify-center gap-1.5 transition shadow-xs min-h-[42px]"
                  title="Open WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  <span>WhatsApp</span>
                </button>

                {hasPermission("devotees:edit") && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 min-h-[42px] ${
                      isEditing ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#08415C]" />
                    <span className="hidden sm:inline">{isEditing ? "Cancel" : "Edit"}</span>
                  </button>
                )}

                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="p-2 border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-xl transition min-h-[42px] min-w-[42px] flex items-center justify-center"
                    title="More Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-12 z-30 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1 text-left text-xs text-stone-700">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(person.mobile);
                          setIsMoreMenuOpen(false);
                          setSaveFeedback({ type: "success", message: "Mobile number copied to clipboard!" });
                          setTimeout(() => setSaveFeedback(null), 2500);
                        }}
                        className="w-full px-3 py-2 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Phone className="w-3.5 h-3.5 text-stone-500" />
                        <span>Copy Mobile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("person-modal-photo-upload") as HTMLInputElement;
                          if (input) input.click();
                          setIsMoreMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#08415C]" />
                        <span>Click / Update Photo</span>
                      </button>

                      <div className="border-t border-stone-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleDeletePerson();
                        }}
                        className="w-full px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Contact</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Inline Form (if user tapped Edit) */}
          {isEditing && (
            <form onSubmit={handleSaveEdit} className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-amber-700" /> Edit Devotee Information
                </span>
                <span className="text-[11px] text-amber-700">Save changes to update CRM master record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Mobile</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Status / Stage</label>
                  <select
                    value={editFormData.stage}
                    onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="New Member">New Member</option>
                    <option value="Interested">Interested</option>
                    <option value="Registered">Registered</option>
                    <option value="Attended">Attended</option>
                    <option value="Regular">Regular</option>
                    <option value="Follow-up Required">Follow-up Required</option>
                    <option value="Connected">Connected</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={editFormData.area}
                    onChange={(e) => setEditFormData({ ...editFormData, area: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Profession</label>
                  <input
                    type="text"
                    value={editFormData.profession}
                    onChange={(e) => setEditFormData({ ...editFormData, profession: e.target.value })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">Daily Japa Rounds</label>
                  <input
                    type="number"
                    min={0}
                    max={64}
                    value={editFormData.japaDailyRounds}
                    onChange={(e) => setEditFormData({ ...editFormData, japaDailyRounds: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold text-stone-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-[#08415C] text-white rounded-lg text-xs font-bold hover:bg-[#063349] flex items-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* PRIORITY 2 – QUICK CALL LOGGING (Most Important Workflow, Expanded at Top) */}
          <div className="p-3.5 sm:p-4 bg-white border border-[#E5D8B8] rounded-2xl shadow-xs space-y-3">
            {/* Horizontal Tabs: Log Call | Follow-up | Note */}
            <div className="flex border-b border-stone-200 pb-2 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveRightTab("log_call")}
                className={`flex-1 py-2 px-3 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                  activeRightTab === "log_call"
                    ? "bg-[#08415C] text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Log Call</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("add_task")}
                className={`flex-1 py-2 px-3 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                  activeRightTab === "add_task"
                    ? "bg-[#08415C] text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Follow-up</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("add_note")}
                className={`flex-1 py-2 px-3 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                  activeRightTab === "add_note"
                    ? "bg-[#08415C] text-white shadow-xs"
                    : "text-stone-600 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Note</span>
              </button>
            </div>

            {/* TAB 1: Log Call Form */}
            {activeRightTab === "log_call" && (
              <form onSubmit={handleLogCall} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Call Disposition / Outcome
                  </label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-semibold text-xs text-stone-800 outline-none focus:ring-2 focus:ring-[#08415C]/20"
                  >
                    <option value="YES_WILL_ATTEND">✓ Yes, Will Attend</option>
                    <option value="INTERESTED">🌟 Interested</option>
                    <option value="CONFIRM_LATER">⏰ Confirm Later</option>
                    <option value="NOT_CONFIRMED">❓ Not Confirmed</option>
                    <option value="CALL_NOT_PICKED">📞 Call Not Picked</option>
                    <option value="NOT_REACHABLE">🚫 Not Reachable / Switched Off</option>
                    <option value="NO_WILL_NOT_ATTEND">✗ No, Will Not Attend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    What was discussed? *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Details of the discussion, devotee response..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl outline-none text-xs focus:ring-2 focus:ring-[#08415C]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Schedule Next Follow-up (Optional)
                  </label>
                  <input
                    type="date"
                    value={callNextDate}
                    onChange={(e) => setCallNextDate(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white text-xs outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="w-full py-2.5 bg-[#00A896] hover:bg-[#028090] text-white font-bold rounded-xl shadow-xs transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionSubmitting ? "Recording..." : "Save Call Activity"}</span>
                </button>
              </form>
            )}

            {/* TAB 2: Follow-up Form */}
            {activeRightTab === "add_task" && (
              <form onSubmit={handleAddTask} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Task Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-semibold text-xs text-stone-800 outline-none"
                  >
                    <option value="Calling">Follow-up Call</option>
                    <option value="WhatsApp">WhatsApp Reminder</option>
                    <option value="Course Follow-up">Course Absentee Follow-up</option>
                    <option value="Relationship Call">Counseling Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Task Remarks
                  </label>
                  <input
                    type="text"
                    value={taskRemarks}
                    onChange={(e) => setTaskRemarks(e.target.value)}
                    placeholder="e.g. Inquire about BG Chapter 2 notes..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="w-full py-2.5 bg-[#08415C] hover:bg-[#063349] text-white font-bold rounded-xl shadow-xs transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>{actionSubmitting ? "Saving..." : "Create Follow-up Task"}</span>
                </button>
              </form>
            )}

            {/* TAB 3: Add Note Form */}
            {activeRightTab === "add_note" && (
              <form onSubmit={handleAddNote} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Append Note to Dossier
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add important notes or personal devotee context..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="w-full py-2.5 bg-[#08415C] hover:bg-[#063349] text-white font-bold rounded-xl shadow-xs transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  <span>{actionSubmitting ? "Adding..." : "Add Note to Dossier"}</span>
                </button>
              </form>
            )}
          </div>

          {/* PRIORITY 3 – NEXT FOLLOW-UP TASK (Compact Summary Accordion) */}
          <div className="bg-white border border-[#E5D8B8] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsFollowupTaskOpen(!isFollowupTaskOpen)}
              className="w-full p-3 px-3.5 bg-[#FFFDF8] hover:bg-stone-50 flex items-center justify-between text-left transition"
            >
              <span className="text-xs font-bold text-[#08415C] flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#D4AF37]" />
                <span>Next Follow-up Task</span>
              </span>
              <div className="flex items-center gap-1.5 text-stone-400">
                {nextFollowup && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pending
                  </span>
                )}
                {isFollowupTaskOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isFollowupTaskOpen && (
              <div className="p-3.5 border-t border-stone-100 text-xs">
                {nextFollowup ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-stone-900 text-sm">{nextFollowup.type}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Due: {new Date(nextFollowup.dueDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-1 text-xs">{nextFollowup.remarks || "Follow-up discussion scheduled"}</p>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">
                        Assigned Caller: <strong>{person.assignedVolunteer?.name || "Caller"}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(nextFollowup.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1 self-end sm:self-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-stone-500 py-1">
                    <span>No Follow-up Scheduled.</span>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab("add_task")}
                      className="text-xs font-bold text-[#08415C] hover:underline"
                    >
                      + Schedule Follow-up
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIORITY 4 – BASIC INFORMATION (Collapsed Accordion by default) */}
          <div className="bg-white border border-[#E5D8B8] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
              className="w-full p-3 px-3.5 bg-[#FFFDF8] hover:bg-stone-50 flex items-center justify-between text-left transition"
            >
              <span className="text-xs font-bold text-[#08415C] flex items-center gap-2">
                <User className="w-4 h-4 text-[#08415C]" />
                <span>Basic Information</span>
              </span>
              <div className="flex items-center gap-1.5 text-stone-400">
                {isBasicInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isBasicInfoOpen && (
              <div className="p-3.5 border-t border-stone-100 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Profession</span>
                    <span className="font-semibold text-stone-800">{person.profession || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Age / Group</span>
                    <span className="font-semibold text-stone-800">{person.ageGroup || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Source / Campaign</span>
                    <span className="font-semibold text-stone-800">{person.source || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Calling Person</span>
                    <span className="font-semibold text-[#08415C]">{person.assignedVolunteer?.name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Relationship Steward</span>
                    <span className="font-semibold text-[#B8860B]">{person.relationshipVolunteer?.name || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Registered Since</span>
                    <span className="font-semibold text-stone-800">{new Date(person.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  {person.spiritualMentor && (
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Spiritual Mentor</span>
                      <span className="font-semibold text-stone-800">{person.spiritualMentor}</span>
                    </div>
                  )}
                  {person.japaDailyRounds > 0 && (
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">Daily Japa Rounds</span>
                      <span className="font-semibold text-stone-800">📿 {person.japaDailyRounds} Rounds</span>
                    </div>
                  )}
                </div>

                {person.notes && (
                  <div className="pt-2 border-t border-stone-100 text-xs">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Notes / Background</span>
                    <p className="text-stone-700 mt-1 whitespace-pre-wrap text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      {person.notes}
                    </p>
                  </div>
                )}

                {/* Additional Custom Fields Display */}
                {getCustomFields(person).length > 0 && (
                  <div className="pt-2 border-t border-stone-100 text-xs">
                    <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1.5">
                      Additional Information / Custom Fields
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {getCustomFields(person).map((f, i) => (
                        <div key={i} className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                          <span className="text-[10px] text-stone-500 uppercase font-bold block">{f.key}</span>
                          <span className="font-semibold text-stone-800 text-xs">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIORITY 5 – COURSES & BATCHES (Collapsed Accordion by default) */}
          <div className="bg-white border border-[#E5D8B8] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-3 px-3.5 bg-[#FFFDF8] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                className="flex-1 flex items-center justify-between text-left mr-2"
              >
                <span className="text-xs font-bold text-[#08415C] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#08415C]" />
                  <span>Courses &amp; Batches ({person.courseEnrollments?.length || 0})</span>
                </span>
                <div className="flex items-center gap-1.5 text-stone-400">
                  {isCoursesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {hasPermission("courses:manage") && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCoursesOpen(true);
                    setIsEnrollingCourse(true);
                    if (coursesList.length === 0) fetchCoursesList();
                  }}
                  className="text-[11px] font-bold text-[#08415C] hover:text-[#063349] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Add / Enroll</span>
                </button>
              )}
            </div>

            {isCoursesOpen && (
              <div className="p-3.5 border-t border-stone-100 text-xs space-y-3">
                {isEnrollingCourse && (
                  <form onSubmit={handleEnrollInBatch} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-[#08415C] block">Select Course &amp; Batch for {person.fullName}:</span>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        required
                        value={selectedEnrollBatchId}
                        onChange={(e) => setSelectedEnrollBatchId(e.target.value)}
                        className="flex-1 p-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-[#08415C] outline-none"
                      >
                        <option value="">Choose Course &amp; Batch...</option>
                        {coursesList.map((c) => (
                          <optgroup key={c.id} label={c.title}>
                            {c.batches && c.batches.length > 0 ? (
                              c.batches.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  {c.title} ➔ {b.batchName} ({b.scheduleInfo || "Weekly"})
                                </option>
                              ))
                            ) : (
                              <option disabled value="">(No active batches created)</option>
                            )}
                          </optgroup>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEnrollingCourse(false)}
                          className="px-3 py-1.5 border rounded-lg text-stone-600 font-bold bg-white hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={enrollingLoading || !selectedEnrollBatchId}
                          className="px-3.5 py-1.5 bg-[#08415C] hover:bg-[#063349] text-white rounded-lg font-bold shadow-xs disabled:opacity-50 flex items-center gap-1"
                        >
                          <span>{enrollingLoading ? "Enrolling..." : "Enroll Now"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {person.courseEnrollments && person.courseEnrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500">
                          <th className="py-2">Course &amp; Batch</th>
                          <th className="py-2">Attendance</th>
                          <th className="py-2">Status</th>
                          {hasPermission("courses:manage") && <th className="py-2 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {person.courseEnrollments.map((enr: any) => {
                          const attendedSessions = enr.attendances?.filter((a: any) => a.attended).length || 0;
                          const totalSessions = enr.attendances?.length || 8;

                          return (
                            <tr key={enr.id} className="hover:bg-stone-50">
                              <td className="py-2.5 font-bold text-[#08415C]">
                                {enr.course?.title || "Course"}
                                {enr.batch?.batchName && (
                                  <span className="block text-[10px] text-stone-500 font-normal">
                                    {enr.batch.batchName}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 font-mono font-semibold">
                                {attendedSessions} / {totalSessions}
                              </td>
                              <td className="py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                                  {enr.status || "Active"}
                                </span>
                              </td>
                              {hasPermission("courses:manage") && (
                                <td className="py-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleUnenrollFromBatch(enr.id, enr.batch?.batchName || enr.course?.title)}
                                    className="p-1 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded transition"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl text-center space-y-2">
                    <p className="text-xs text-stone-500">No course enrollments linked yet to {person.fullName}.</p>
                    {hasPermission("courses:manage") && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEnrollingCourse(true);
                          if (coursesList.length === 0) fetchCoursesList();
                        }}
                        className="px-3.5 py-1.5 bg-[#08415C] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Enroll Devotee in Course / Batch</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIORITY 6 – CALLING SEWA HISTORY (Collapsed Accordion by default) */}
          <div className="bg-white border border-[#E5D8B8] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCallingHistoryOpen(!isCallingHistoryOpen)}
              className="w-full p-3 px-3.5 bg-[#FFFDF8] hover:bg-stone-50 flex items-center justify-between text-left transition"
            >
              <span className="text-xs font-bold text-[#08415C] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#00A896]" />
                <span>Calling Sewa History ({person.callLogs?.length || 0})</span>
              </span>
              <div className="flex items-center gap-1.5 text-stone-400">
                {isCallingHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isCallingHistoryOpen && (
              <div className="p-3.5 border-t border-stone-100 text-xs space-y-2">
                {person.callLogs && person.callLogs.length > 0 ? (
                  person.callLogs.map((log: any) => (
                    <div key={log.id} className="p-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#08415C] flex items-center gap-1.5">
                          <span>{log.callType}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {log.outcome.replace(/_/g, " ")}
                          </span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(log.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      {log.notes && <p className="text-stone-700 text-xs italic">&quot;{log.notes}&quot;</p>}
                      <div className="text-[10px] text-[#B8860B]">
                        Called by: {log.volunteer?.name || "Volunteer"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500 italic p-2 text-center">No previous call records.</p>
                )}
              </div>
            )}
          </div>

          {/* PRIORITY 7 – CHRONOLOGICAL ACTIVITY STREAM (Collapsed Accordion by default) */}
          <div className="bg-white border border-[#E5D8B8] rounded-2xl shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsActivityStreamOpen(!isActivityStreamOpen)}
              className="w-full p-3 px-3.5 bg-[#FFFDF8] hover:bg-stone-50 flex items-center justify-between text-left transition"
            >
              <span className="text-xs font-bold text-[#08415C] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>Chronological Activity Stream</span>
              </span>
              <div className="flex items-center gap-1.5 text-stone-400">
                {isActivityStreamOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isActivityStreamOpen && (
              <div className="p-3.5 border-t border-stone-100 text-xs space-y-2">
                {person.timelineEvents && person.timelineEvents.length > 0 ? (
                  person.timelineEvents.map((evt: any) => (
                    <div key={evt.id} className="p-2 bg-[#FAF8F5] border border-stone-200 rounded-lg">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="font-bold text-[#08415C]">{evt.title}</span>
                        <span>{new Date(evt.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      {evt.description && <p className="text-stone-700 mt-0.5 text-xs">{evt.description}</p>}
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 bg-[#FAF8F5] border border-stone-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span className="font-bold text-[#08415C]">Devotee Registered</span>
                      <span>{new Date(person.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    <p className="text-stone-600 text-[11px]">Registered as {person.stage} in Chandkheda CRM</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PersonModal;
