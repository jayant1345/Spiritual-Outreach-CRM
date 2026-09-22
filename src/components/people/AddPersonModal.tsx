"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonAdded: () => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onPersonAdded,
}) => {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("Chandkheda");
  const [ageGroup, setAgeGroup] = useState("26-35");
  const [profession, setProfession] = useState("");
  const [source, setSource] = useState("Book Distribution");
  const [stage, setStage] = useState("New Person");
  const [assignedVolunteerId, setAssignedVolunteerId] = useState("");
  const [relationshipVolunteerId, setRelationshipVolunteerId] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [japaRounds, setJapaRounds] = useState(0);

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/volunteers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setVolunteers(data);
            if (data.length > 0) {
              setAssignedVolunteerId(data[0].id);
              setRelationshipVolunteerId(data[1]?.id || data[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          mobile,
          whatsappNumber: whatsappNumber || mobile,
          email,
          area,
          ageGroup,
          profession,
          source,
          stage,
          assignedVolunteerId: assignedVolunteerId || null,
          relationshipVolunteerId: relationshipVolunteerId || null,
          tags,
          notes,
          japaDailyRounds: Number(japaRounds),
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
      title="Add Devotee / Contact to Master DB"
      subtitle="Register new seeker or contact into Chandkheda CRM"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Full Name *
            </label>
            <input
              required
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Patel"
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Mobile Number * (Unique)
            </label>
            <input
              required
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10 digit mobile"
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Area / Locality
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Chandkheda, Motera, Sabarmati, etc."
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Age Group
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="Youth (18-25)">Youth (18-25)</option>
              <option value="26-35">26-35</option>
              <option value="36-50">36-50</option>
              <option value="50+">50+</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Profession / Occupation
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Software Engineer, Doctor, Student"
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Lead Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="Friend / Reference">Friend / Reference</option>
              <option value="Society Outreach">Society Outreach</option>
              <option value="Book Distribution">Book Distribution</option>
              <option value="Program Stall">Program Stall</option>
              <option value="Instagram / YouTube">Instagram / YouTube</option>
              <option value="Website Form">Website Form</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Assigned Calling Sewak
            </label>
            <select
              value={assignedVolunteerId}
              onChange={(e) => setAssignedVolunteerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="">Unassigned</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
              Relationship Steward
            </label>
            <select
              value={relationshipVolunteerId}
              onChange={(e) => setRelationshipVolunteerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="">Unassigned</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
            Tags (Comma separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. Youth, Gita Student, Volunteer, Doctor"
            className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1">
            Initial Notes & Devotee Remarks
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details of first interaction or background..."
            className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5D8B8]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5D8B8] text-xs font-semibold text-[#78909C] hover:bg-[#FAF8F5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold transition"
          >
            {saving ? "Registering..." : "Add Devotee Contact"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddPersonModal;
