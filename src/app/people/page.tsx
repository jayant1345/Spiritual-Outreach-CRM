"use client";

import React, { useState, useEffect, useContext } from "react";
import { CRMContext } from "@/components/layout/RootShell";
import Badge from "@/components/common/Badge";
import ImportExportModal from "@/components/people/ImportExportModal";
import {
  Users,
  Search,
  Filter,
  Plus,
  PhoneCall,
  MessageSquare,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  MapPin,
  ChevronDown,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function PeoplePage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, openAddPersonModal, refreshTrigger } = useContext(CRMContext);

  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedSource, setSelectedSource] = useState("ALL");
  const [selectedVolunteer, setSelectedVolunteer] = useState("ALL");
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPeople();
    fetchVolunteers();
  }, [refreshTrigger, searchQuery, selectedArea, selectedStage, selectedSource, selectedVolunteer]);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedArea !== "ALL") params.append("area", selectedArea);
      if (selectedStage !== "ALL") params.append("stage", selectedStage);
      if (selectedSource !== "ALL") params.append("source", selectedSource);
      if (selectedVolunteer !== "ALL") params.append("volunteerId", selectedVolunteer);

      const res = await fetch(`/api/people?${params.toString()}`);
      const data = await res.json();
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch("/api/volunteers");
      const data = await res.json();
      if (Array.isArray(data)) setVolunteers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(people.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            Master Devotee & Contact Database
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Central repository connecting multi-program history, course enrollments, calling sewa, and sadhana logs
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => setIsImportExportOpen(true)}
            className="px-3.5 py-2 bg-white border border-[#E5D8B8] hover:border-[#D4AF37] text-xs font-semibold text-[#08415C] rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A896]" />
            <span>Excel Import / Export</span>
          </button>

          <button
            onClick={openAddPersonModal}
            className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Add New Devotee</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="gold-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Universal Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#78909C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Localities</option>
              <option value="Chandkheda">Chandkheda</option>
              <option value="Motera">Motera</option>
              <option value="Sabarmati">Sabarmati</option>
              <option value="Nigam Nagar">Nigam Nagar</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Stages</option>
              <option value="New Person">New Person</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Invited">Invited</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Attended">Attended</option>
              <option value="Relationship Follow-up">Relationship Follow-up</option>
              <option value="Connected">Connected</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Sources</option>
              <option value="Book Distribution">Book Distribution</option>
              <option value="Program Stall">Program Stall</option>
              <option value="Society Outreach">Society Outreach</option>
              <option value="Friend / Reference">Friend / Reference</option>
              <option value="Instagram / YouTube">Instagram / YouTube</option>
            </select>
          </div>

          {/* Volunteer Filter */}
          <div>
            <select
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Assigned Sewaks</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary & Bulk Status */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5D8B8]/50">
          <span className="text-[#78909C]">
            Showing <strong>{people.length}</strong> matching devotee contacts
          </span>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#08415C]">
                {selectedIds.length} Selected
              </span>
              <button
                onClick={() => setIsImportExportOpen(true)}
                className="px-2.5 py-1 bg-[#08415C] text-white text-[11px] font-semibold rounded-lg"
              >
                Export Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Devotee Table */}
      <div className="gold-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E5D8B8] text-[#78909C] uppercase font-semibold">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={people.length > 0 && selectedIds.length === people.length}
                    className="rounded border-[#E5D8B8]"
                  />
                </th>
                <th className="p-3.5">Devotee Name & Contact</th>
                <th className="p-3.5">Locality & Source</th>
                <th className="p-3.5">Stage / Journey</th>
                <th className="p-3.5">Course & Program Status</th>
                <th className="p-3.5">Assigned Sewak</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D8B8]/60 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#78909C]">
                    <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                    <p>Loading Devotee Records...</p>
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#78909C]">
                    No devotees found matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                people.map((person) => {
                  const isSelected = selectedIds.includes(person.id);

                  return (
                    <tr
                      key={person.id}
                      className={`hover:bg-[#FAF8F5] transition ${
                        isSelected ? "bg-[#FAF5E6]" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(person.id)}
                          className="rounded border-[#E5D8B8]"
                        />
                      </td>

                      {/* Name & Phone */}
                      <td className="p-3.5">
                        <div
                          className="cursor-pointer group"
                          onClick={() => openPersonModal(person.id)}
                        >
                          <div className="font-serif font-bold text-sm text-[#08415C] group-hover:text-[#0B4F6C] flex items-center gap-1.5">
                            <span>{person.fullName}</span>
                            {person.japaDailyRounds > 0 && (
                              <span className="text-[10px] text-[#B8860B] bg-[#FAF5E6] px-1 rounded">
                                📿 {person.japaDailyRounds}R
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#78909C] flex items-center gap-1 mt-0.5">
                            <span>+91 {person.mobile}</span>
                            {person.profession && <span>• {person.profession}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Locality & Source */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 font-medium text-[#37474F]">
                          <MapPin className="w-3 h-3 text-[#D4AF37]" />
                          <span>{person.area || "Chandkheda"}</span>
                        </div>
                        <span className="text-[10px] text-[#78909C]">
                          Source: {person.source}
                        </span>
                      </td>

                      {/* Stage Badge */}
                      <td className="p-3.5">
                        <Badge variant="morpankh">{person.stage}</Badge>
                      </td>

                      {/* Course / Program Details */}
                      <td className="p-3.5">
                        {person.courseEnrollments && person.courseEnrollments.length > 0 ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-semibold text-[#08415C]">
                              {person.courseEnrollments[0].course?.title.split("—")[0]}
                            </span>
                            <span className="text-[#00A896] font-bold">
                              ({person.courseEnrollments[0].attendancePercent}%)
                            </span>
                          </div>
                        ) : person.programParticipations && person.programParticipations.length > 0 ? (
                          <span className="text-[11px] text-[#37474F]">
                            RSVP: {person.programParticipations[0].invitationStatus}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#78909C] italic">No active enrollments</span>
                        )}
                      </td>

                      {/* Assigned Sewak */}
                      <td className="p-3.5 text-xs text-[#37474F]">
                        {person.assignedVolunteer ? (
                          <span className="font-semibold text-[#08415C]">
                            {person.assignedVolunteer.name}
                          </span>
                        ) : (
                          <span className="text-[#78909C] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCallModal(person)}
                            className="p-1.5 bg-[#00A896] hover:bg-[#028090] text-white rounded-lg transition"
                            title="Click to Dial"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openWhatsAppModal(person)}
                            className="p-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white rounded-lg border border-[#D4AF37]/50 transition"
                            title="Send WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                          </button>
                          <button
                            onClick={() => openPersonModal(person.id)}
                            className="p-1.5 bg-white border border-[#E5D8B8] hover:border-[#D4AF37] text-[#08415C] rounded-lg transition"
                            title="Open 360° Profile Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import / Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        filteredPeople={
          selectedIds.length > 0
            ? people.filter((p) => selectedIds.includes(p.id))
            : people
        }
        onImportSuccess={() => {
          fetchPeople();
          setIsImportExportOpen(false);
        }}
      />
    </div>
  );
}
