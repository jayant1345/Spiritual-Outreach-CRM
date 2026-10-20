"use client";

import React, { useState, useEffect, useContext } from "react";
import { Modal } from "../common/Modal";
import {
  User,
  Users,
  AlertTriangle,
  ExternalLink,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Layers,
  Tag,
  Plus,
  X,
  Bookmark,
  Camera,
  Upload,
  Sliders,
  Trash2,
} from "lucide-react";
import { CRMContext } from "../layout/RootShell";

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded: () => void;
  initialCourseId?: string;
  initialBatchId?: string;
}

const SUGGESTED_LABELS = [
  "Youth",
  "Chairman",
  "Senior Citizen",
  "Life Patron",
  "Donor",
  "Volunteer",
  "Sunday Feast",
  "Book Reader",
];

const SUGGESTED_TAGS = [
  "Interested",
  "Not Interested",
  "Connected",
  "Regular",
  "New Seeker",
  "Follow-up Required",
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onPersonAdded,
  initialCourseId,
  initialBatchId,
}) => {
  const { openPersonModal } = useContext(CRMContext);

  // Selection: Individual vs Family
  const [memberType, setMemberType] = useState<"individual" | "family">("individual");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [area, setArea] = useState("Chandkheda");
  const [city, setCity] = useState("Ahmedabad");
  const [profession, setProfession] = useState("");
  const [source, setSource] = useState("Book Distribution");
  const [referredBy, setReferredBy] = useState("");
  const [stage, setStage] = useState("New Member");
  const [assignedVolunteerId, setAssignedVolunteerId] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // Course & Batch enrollment options
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || "");
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || "");

  // Member Labels (Youth, Chairman, Senior Citizen, etc.)
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState<string>("");

  // Status & Outreach Tags (Interested, Not Interested, Connected, Regular, etc.)
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");

  // Custom Fields (Add Manually Field: Key & Value)
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
  const [newCustomKey, setNewCustomKey] = useState<string>("");
  const [newCustomVal, setNewCustomVal] = useState<string>("");

  // Family specific fields
  const [familyMembersCount, setFamilyMembersCount] = useState(2);
  const [familyDetails, setFamilyDetails] = useState("");

  // Duplicate warning state
  const [existingPerson, setExistingPerson] = useState<any>(null);
  const [checkingMobile, setCheckingMobile] = useState(false);

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate age when DOB changes
  useEffect(() => {
    if (!dob) {
      setCalculatedAge(null);
      return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 0 && age < 120) {
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [dob]);

  // Check duplicate phone on mobile change
  useEffect(() => {
    const clean = mobile.replace(/[^0-9]/g, "").slice(-10);
    if (clean.length < 10) {
      setExistingPerson(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingMobile(true);
        const res = await fetch(`/api/people/check-mobile?mobile=${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.person) {
            setExistingPerson(data.person);
          } else {
            setExistingPerson(null);
          }
        }
      } catch (err) {
        console.error("Duplicate check error:", err);
      } finally {
        setCheckingMobile(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [mobile]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/volunteers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setVolunteers(data);
            if (data.length > 0) {
              setAssignedVolunteerId(data[0].id);
            }
          }
        })
        .catch(console.error);

      // Load active courses for batch enrollment option
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCoursesList(data);
          }
        })
        .catch(console.error);

      if (initialCourseId) setSelectedCourseId(initialCourseId);
      if (initialBatchId) setSelectedBatchId(initialBatchId);
    }
  }, [isOpen, initialCourseId, initialBatchId]);

  const handleAddLabel = (labelToAdd?: string) => {
    const val = (labelToAdd || newLabelInput).trim();
    if (!val) return;
    if (!labels.includes(val)) {
      setLabels((prev) => [...prev, val]);
    }
    setNewLabelInput("");
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels((prev) => prev.filter((l) => l !== labelToRemove));
  };

  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || newTagInput).trim();
    if (!val) return;
    if (!tags.includes(val)) {
      setTags((prev) => [...prev, val]);
      if (["Interested", "Not Interested", "Connected", "Regular", "Follow-up Required", "New Member"].includes(val)) {
        setStage(val);
      }
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleAddCustomField = () => {
    if (!newCustomKey.trim() || !newCustomVal.trim()) return;
    setCustomFields((prev) => [
      ...prev.filter((f) => f.key.toLowerCase() !== newCustomKey.trim().toLowerCase()),
      { key: newCustomKey.trim(), value: newCustomVal.trim() },
    ]);
    setNewCustomKey("");
    setNewCustomVal("");
  };

  const handleRemoveCustomField = (indexToRemove: number) => {
    setCustomFields((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
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
        setPhotoUrl(compressed);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !mobile.trim()) {
      setError("Please fill in mandatory fields: Full Name and Mobile Number.");
      return;
    }

    setSaving(true);

    try {
      const combinedNotes = memberType === "family"
        ? `[Family Registration - ${familyMembersCount} Members: ${familyDetails}] ${notes}`.trim()
        : (referredBy ? `[Referred By: ${referredBy}] ${notes}`.trim() : notes);

      // Build customData object with custom fields, photo, and labels
      const customDataObj: any = {};
      if (photoUrl) customDataObj.photoUrl = photoUrl;
      if (labels.length > 0) customDataObj.labels = labels;
      if (customFields.length > 0) {
        customFields.forEach((cf) => {
          if (cf.key.trim() && cf.value.trim()) {
            customDataObj[cf.key.trim()] = cf.value.trim();
          }
        });
      }

      // Determine stage
      const matchingStageTag = tags.find((t) =>
        ["Interested", "Not Interested", "Connected", "Regular", "Follow-up Required", "New Member"].includes(t)
      );
      const effectiveStage = matchingStageTag || stage || "New Member";

      const allTags = memberType === "family"
        ? ["Family", gender, ...labels, ...tags]
        : [gender, ...labels, ...tags];
      const uniqueTags = Array.from(new Set(allTags.filter(Boolean))).join(", ");

      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobile,
          whatsappNumber: whatsappNumber || mobile,
          email,
          area: `${area}${city ? `, ${city}` : ""}`,
          ageGroup: calculatedAge ? `${calculatedAge} yrs` : undefined,
          profession,
          source: referredBy ? `Referral (${referredBy})` : source,
          stage: effectiveStage,
          assignedVolunteerId: assignedVolunteerId || null,
          notes: combinedNotes,
          tags: uniqueTags,
          photoUrl: photoUrl || undefined,
          customData: Object.keys(customDataObj).length > 0 ? customDataObj : undefined,
          courseId: selectedCourseId || undefined,
          batchId: selectedBatchId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create contact");
      }

      onPersonAdded();
      onClose();

      // Reset form
      setFullName("");
      setMobile("");
      setEmail("");
      setNotes("");
      setDob("");
      setSelectedCourseId("");
      setSelectedBatchId("");
      setLabels([]);
      setNewLabelInput("");
      setTags([]);
      setNewTagInput("");
      setCustomFields([]);
      setNewCustomKey("");
      setNewCustomVal("");
      setExistingPerson(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Member"
      subtitle="Register new devotee or seeker into central CRM database"
      maxWidth="2xl"
      headerAction={
        <button
          type="button"
          onClick={() => {
            const form = document.getElementById("add-member-form") as HTMLFormElement;
            if (form) form.requestSubmit();
          }}
          disabled={saving}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl text-xs font-bold shadow-gold disabled:opacity-60 transition flex items-center gap-1.5 flex-shrink-0"
          title="Save Member immediately"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{saving ? "Saving..." : "Save Member"}</span>
        </button>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Who are we adding? */}
        <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5D8B8]">
          <label className="block text-xs font-bold text-[#08415C] uppercase tracking-wider mb-2">
            Who are we adding? *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMemberType("individual")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
                memberType === "individual"
                  ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Individual</span>
            </button>

            <button
              type="button"
              onClick={() => setMemberType("family")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition border ${
                memberType === "family"
                  ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Family</span>
            </button>
          </div>
        </div>

        {/* Contact Photo / Camera Capture (Admin Requirement) */}
        <div className="bg-[#FAF8F5] p-3 sm:p-3.5 rounded-2xl border border-[#E5D8B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Contact preview"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37] shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center border-2 border-dashed border-stone-300">
                  <Camera className="w-6 h-6 text-stone-400" />
                </div>
              )}
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition"
                  title="Remove photo"
                >
                  ✕
                </button>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#08415C]">Contact Photo</h4>
              <p className="text-[11px] text-stone-500">
                Click or upload photo so callers can identify contacts easily
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Click Photo with Camera */}
            <label className="px-3 py-1.5 bg-white border border-[#E5D8B8] hover:border-[#08415C] text-[#08415C] rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition">
              <Camera className="w-3.5 h-3.5 text-[#00A896]" />
              <span>Click Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {/* Upload from Gallery / Files */}
            <label className="px-3 py-1.5 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        {/* Duplicate Contact Detection Alert */}
        {existingPerson && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">This member already exists!</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  <strong>{existingPerson.fullName}</strong> is already registered with mobile{" "}
                  <strong>{existingPerson.mobile}</strong> ({existingPerson.stage}).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                openPersonModal(existingPerson.id);
              }}
              className="px-2.5 py-1.5 bg-[#08415C] text-white rounded-lg text-xs font-semibold hover:bg-[#063349] flex items-center gap-1 flex-shrink-0"
            >
              <span>Open Profile</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Main Form Fields */}
        <div className="space-y-3.5">
          {/* Name & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                {memberType === "family" ? "Family Head / Contact Name *" : "Full Name *"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Patel"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98250 XXXXX"
                className={`w-full text-xs p-2.5 border rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none ${
                  existingPerson ? "border-amber-500 bg-amber-50/30" : "border-stone-300"
                }`}
              />
            </div>
          </div>

          {/* Email & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Date of Birth & Automatic Age Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Date of Birth</span>
                {calculatedAge !== null && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Age: {calculatedAge} Years
                  </span>
                )}
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Profession / Occupation
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. IT Engineer, Student, Business"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          {/* Area & City (Default Ahmedabad, editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Area / Locality
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Chandkheda, Motera, Sabarmati"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                City (Default Ahmedabad)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ahmedabad"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          {/* Family specific fields if family selected */}
          {memberType === "family" && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Family Size (Members)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={familyMembersCount}
                    onChange={(e) => setFamilyMembersCount(parseInt(e.target.value) || 2)}
                    className="w-full text-xs p-2 border border-blue-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Family Details (Names & Ages)
                  </label>
                  <input
                    type="text"
                    value={familyDetails}
                    onChange={(e) => setFamilyDetails(e.target.value)}
                    placeholder="e.g. Spouse: Anita (27), Son: Aarav (4)"
                    className="w-full text-xs p-2 border border-blue-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* How did they connect & Referred By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                How did they connect with us?
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
              >
                <option value="Book Distribution">Book Distribution Stall</option>
                <option value="Temple Visit">Direct Temple Visit / Darshan</option>
                <option value="Society Outreach">Society / Home Outreach</option>
                <option value="Sunday Feast">Sunday Love Feast Program</option>
                <option value="Festival">Janmashtami / Gaura Purnima Festival</option>
                <option value="Youth Seminar">Youth Seminar / College Outreach</option>
                <option value="Social Media">Social Media / WhatsApp</option>
                <option value="Reference">Devotee Reference / Friend</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Referred By (Devotee / Friend Name)
              </label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="e.g. HG Madhava Das"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          {/* Assigned Volunteer & Member Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Assigned Calling / Devotee Care Volunteer
              </label>
              <select
                value={assignedVolunteerId}
                onChange={(e) => setAssignedVolunteerId(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
              >
                {volunteers.map((vol) => (
                  <option key={vol.id} value={vol.id}>
                    {vol.name} ({vol.role.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Member Status
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
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

          {/* Course & Batch Enrollment (Admin requirement) */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5D8B8]">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-[#08415C]" />
              <label className="text-xs font-bold text-[#08415C] uppercase tracking-wider">
                Course & Batch Enrollment (Optional)
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Select Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    setSelectedCourseId(e.target.value);
                    setSelectedBatchId("");
                  }}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium"
                >
                  <option value="">-- No Course (General Seeker) --</option>
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Select Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  disabled={!selectedCourseId}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-medium disabled:bg-stone-100 disabled:text-stone-400"
                >
                  <option value="">
                    {selectedCourseId ? "-- Choose Batch --" : "-- Select course first --"}
                  </option>
                  {coursesList
                    .find((c) => c.id === selectedCourseId)
                    ?.batches?.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName} {b.scheduleInfo ? `(${b.scheduleInfo})` : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {selectedBatchId && (
              <p className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>This member will be automatically enrolled and visible in this batch&apos;s calling roster.</span>
              </p>
            )}
          </div>

          {/* BOX 1: Member Labels (Admin requirement: Youth, Chairman, Senior Citizen, etc.) */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E5D8B8] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#08415C] uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Member Labels (e.g. Youth, Chairman, Senior Citizen)</span>
              </label>
              <span className="text-[10px] text-stone-400">Select presets or add custom label</span>
            </div>

            {/* Active Labels Chips */}
            {labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#08415C] border border-[#D4AF37] shadow-2xs"
                  >
                    <span>🏷️ {lbl}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(lbl)}
                      className="text-stone-400 hover:text-rose-600 transition ml-0.5"
                      aria-label={`Remove ${lbl}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input to Add Custom Label Manually */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLabel();
                  }
                }}
                placeholder="Type custom label manually (e.g. Chairman, Trustee, Doctor, VIP)..."
                className="flex-1 text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddLabel()}
                className="px-3.5 py-2.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 flex-shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>+ Add Label</span>
              </button>
            </div>

            {/* Preset Suggested Label Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-stone-500 font-bold">Preset Labels:</span>
              {SUGGESTED_LABELS.map((sug) => {
                const isAdded = labels.includes(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => (isAdded ? handleRemoveLabel(sug) : handleAddLabel(sug))}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                      isAdded
                        ? "bg-[#08415C] text-white border-[#08415C] shadow-2xs"
                        : "bg-white text-stone-700 border-stone-300 hover:border-[#D4AF37] hover:bg-[#FAF5E6]"
                    }`}
                  >
                    {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOX 2: Status & Outreach Tags (Admin requirement: Interested, Not Interested, Connected, Regular) */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#00A896]" />
                <span>Status &amp; Outreach Tags (e.g. Interested, Connected, Regular)</span>
              </label>
              <span className="text-[10px] text-stone-400">Select status tag or add custom</span>
            </div>

            {/* Active Tags Chips */}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                  >
                    <span>🔖 {t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-stone-400 hover:text-rose-600 transition ml-0.5"
                      aria-label={`Remove ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input to Add Custom Tag Manually */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type custom tag manually (e.g. Gita Reader, Youth Fest 2026, Camp)..."
                className="flex-1 text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#00A896] outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="px-3.5 py-2.5 bg-[#00A896] hover:bg-[#028090] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 flex-shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Tag</span>
              </button>
            </div>

            {/* Preset Suggested Tag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-stone-500 font-bold">Preset Tags:</span>
              {SUGGESTED_TAGS.map((sug) => {
                const isAdded = tags.includes(sug);
                return (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => (isAdded ? handleRemoveTag(sug) : handleAddTag(sug))}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                      isAdded
                        ? "bg-[#00A896] text-white border-[#00A896] shadow-2xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOX 3: Add Custom Field / Additional Information (Admin requirement: ON OTHER BOX WE CAN GIVE OPTION FOR ADD MANUALLY FIELD) */}
          <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#08415C]" />
                <span>Add Custom Field Manually (વધારાની નવી વિગતો)</span>
              </label>
              <span className="text-[10px] text-stone-500">e.g. Flat No, Company, Native Place</span>
            </div>

            {/* Active Custom Fields List */}
            {customFields.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {customFields.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-white border border-stone-300 shadow-2xs"
                  >
                    <span className="font-bold text-[#08415C]">{field.key}:</span>
                    <span className="text-stone-700">{field.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="text-stone-400 hover:text-rose-600 transition ml-1"
                      aria-label={`Remove ${field.key}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Inputs to Add Custom Field */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-0.5">
              <input
                type="text"
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                placeholder="Field Name (e.g. Company, Flat No)"
                className="sm:col-span-2 text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none font-semibold text-stone-800"
              />
              <input
                type="text"
                value={newCustomVal}
                onChange={(e) => setNewCustomVal(e.target.value)}
                placeholder="Field Value (e.g. TCS, B-402, Mehsana)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomField();
                  }
                }}
                className="sm:col-span-2 text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none text-stone-800"
              />
              <button
                type="button"
                onClick={handleAddCustomField}
                disabled={!newCustomKey.trim() || !newCustomVal.trim()}
                className="sm:col-span-1 px-3 py-2.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              General Notes & Devotional Background
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific interests (e.g. Gita classes, youth programs, mantra meditation, kirtan)..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 italic">
            * Indicates mandatory fields
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl text-xs font-bold shadow-gold disabled:opacity-60 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>{saving ? "Saving Member..." : "Save Member"}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddPersonModal;
