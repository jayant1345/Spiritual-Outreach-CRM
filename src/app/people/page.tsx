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
  FileSpreadsheet,
  MapPin,
  Eye,
  CheckSquare,
  UserCheck,
  Send,
  X,
  ArrowRight,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";

export default function PeoplePage() {
  const { openPersonModal, openCallModal, openWhatsAppModal, openAddPersonModal, refreshTrigger } = useContext(CRMContext);
  const { hasPermission } = useAuth();

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

  // Bulk action states
  const [bulkVolunteerId, setBulkVolunteerId] = useState("");
  const [bulkStage, setBulkStage] = useState("");
  const [bulkActionProcessing, setBulkActionProcessing] = useState(false);

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

  // Bulk Actions
  const handleBulkAssignVolunteer = async () => {
    if (!bulkVolunteerId || selectedIds.length === 0) return;
    setBulkActionProcessing(true);
    try {
      await fetch("/api/people/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "ASSIGN_VOLUNTEER",
          value: bulkVolunteerId,
        }),
      });
      setSelectedIds([]);
      fetchPeople();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionProcessing(false);
    }
  };

  const handleBulkChangeStatus = async () => {
    if (!bulkStage || selectedIds.length === 0) return;
    setBulkActionProcessing(true);
    try {
      await fetch("/api/people/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          action: "CHANGE_STATUS",
          value: bulkStage,
        }),
      });
      setSelectedIds([]);
      fetchPeople();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkActionProcessing(false);
    }
  };

  // Instant Filtered Export (Docx Section 1.8 & 1.10)
  const handleExportFiltered = () => {
    const exportData = people.map((p, idx) => ({
      "Sr No": idx + 1,
      "Full Name": p.fullName,
      "Mobile Number": p.mobile,
      "WhatsApp Number": p.whatsappNumber || p.mobile,
      "Area / Locality": p.area || "",
      "Profession": p.profession || "",
      "Source": p.source || "",
      "Status / Stage": p.stage || "",
      "Assigned Calling Sewak": p.assignedVolunteer?.name || "Unassigned",
      "Relationship Steward": p.relationshipVolunteer?.name || "Unassigned",
      "Daily Japa Rounds": p.japaDailyRounds || 0,
      "Notes": p.notes || "",
      "Registered Date": new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Filtered Members");

    XLSX.writeFile(
      workbook,
      `Chandkheda_Members_Export_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#08415C] flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
            Members & Devotee Directory
          </h2>
          <p className="text-[11px] sm:text-xs text-[#78909C] mt-0.5">
            Central unified member directory across multiple courses, calling activities, and seva
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {hasPermission("devotees:export") && (
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="px-3 py-1.5 sm:py-2 bg-white border border-[#E5D8B8] hover:border-[#D4AF37] text-xs font-semibold text-[#08415C] rounded-xl shadow-xs flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A896]" />
              <span>Import / Export</span>
            </button>
          )}

          {hasPermission("devotees:create") && (
            <button
              onClick={openAddPersonModal}
              className="px-3.5 py-1.5 sm:py-2 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-bold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Add New Members</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="gold-card p-3 sm:p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Universal Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#78909C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, area..."
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
              <option value="New C.G. Road">New C.G. Road</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Member Statuses</option>
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

          {/* Source Filter */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Sources</option>
              <option value="Book Distribution">Book Distribution</option>
              <option value="Temple Visit">Temple Visit</option>
              <option value="Society Outreach">Society Outreach</option>
              <option value="Sunday Feast">Sunday Feast</option>
              <option value="Festival">Festival</option>
              <option value="Youth Seminar">Youth Seminar</option>
            </select>
          </div>

          {/* Volunteer Filter */}
          <div>
            <select
              value={selectedVolunteer}
              onChange={(e) => setSelectedVolunteer(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
            >
              <option value="ALL">All Assigned Callers</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E5D8B8]/50 flex-wrap gap-2">
          <span className="text-[#78909C]">
            Showing <strong>{people.length}</strong> matching members
          </span>

          <div className="flex items-center gap-2">
            {hasPermission("devotees:export") && people.length > 0 && (
              <button
                type="button"
                onClick={handleExportFiltered}
                className="text-[11px] font-bold text-[#08415C] hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Filtered List ({people.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar (Docx Section 1.10) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#08415C] text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn border border-[#D4AF37]/50">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#08415C] flex items-center justify-center text-[11px]">
              {selectedIds.length}
            </span>
            <span>Members Selected for Bulk Action</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            {/* Assign Volunteer */}
            {hasPermission("calling:assign") && (
              <div className="flex items-center gap-1">
                <select
                  value={bulkVolunteerId}
                  onChange={(e) => setBulkVolunteerId(e.target.value)}
                  className="bg-white text-stone-800 text-[11px] p-1.5 rounded-lg outline-none font-semibold"
                >
                  <option value="">Assign Caller...</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!bulkVolunteerId || bulkActionProcessing}
                  onClick={handleBulkAssignVolunteer}
                  className="px-2.5 py-1.5 bg-[#D4AF37] text-[#08415C] rounded-lg text-[11px] font-bold disabled:opacity-60 hover:bg-[#bfa22f]"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Change Status */}
            {hasPermission("devotees:edit") && (
              <div className="flex items-center gap-1">
                <select
                  value={bulkStage}
                  onChange={(e) => setBulkStage(e.target.value)}
                  className="bg-white text-stone-800 text-[11px] p-1.5 rounded-lg outline-none font-semibold"
                >
                  <option value="">Set Status...</option>
                  <option value="New Member">New Member</option>
                  <option value="Interested">Interested</option>
                  <option value="Registered">Registered</option>
                  <option value="Attended">Attended</option>
                  <option value="Regular">Regular</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Connected">Connected</option>
                </select>
                <button
                  type="button"
                  disabled={!bulkStage || bulkActionProcessing}
                  onClick={handleBulkChangeStatus}
                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold disabled:opacity-60 hover:bg-emerald-700"
                >
                  Update
                </button>
              </div>
            )}

            {/* Export Selected */}
            {hasPermission("devotees:export") && (
              <button
                type="button"
                onClick={() => setIsImportExportOpen(true)}
                className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold"
              >
                Export Selected
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-stone-300 hover:text-white"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CARDS VIEW (md:hidden) – Responsive for phones */}
      <div className="md:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={people.length > 0 && selectedIds.length === people.length}
              className="rounded border-[#E5D8B8]"
            />
            <span>Select All ({people.length})</span>
          </label>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#78909C]">
            <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
            <p>Loading members...</p>
          </div>
        ) : people.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
            No members found matching filter criteria.
          </div>
        ) : (
          people.map((person) => {
            const isSelected = selectedIds.includes(person.id);
            return (
              <div
                key={person.id}
                className={`p-3.5 bg-white border rounded-2xl transition space-y-2 shadow-xs ${
                  isSelected ? "border-[#08415C] bg-[#FAF8F5]" : "border-[#E5D8B8]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(person.id)}
                      className="mt-1 rounded border-stone-300"
                    />
                    <div
                      className="cursor-pointer min-w-0"
                      onClick={() => openPersonModal(person.id)}
                    >
                      <h4 className="font-serif font-bold text-sm text-[#08415C] truncate">
                        {person.fullName}
                      </h4>
                      <p className="text-xs font-mono text-stone-600 mt-0.5">+91 {person.mobile}</p>
                    </div>
                  </div>

                  <Badge variant="morpankh" size="sm">{person.stage}</Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" /> {person.area || "Chandkheda"}
                  </span>
                  <span>Caller: {person.assignedVolunteer?.name || "Unassigned"}</span>
                </div>

                {/* Mobile Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openCallModal(person)}
                    className="flex-1 py-1.5 bg-[#00A896] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call
                  </button>
                  <button
                    onClick={() => openWhatsAppModal(person)}
                    className="flex-1 py-1.5 bg-[#08415C] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> WhatsApp
                  </button>
                  <button
                    onClick={() => openPersonModal(person.id)}
                    className="p-1.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg"
                    title="Open 360° Profile"
                  >
                    <Eye className="w-4 h-4 text-[#08415C]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (hidden md:block) */}
      <div className="hidden md:block gold-card overflow-hidden shadow-xs">
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
                <th className="p-3.5">Member Name & Contact</th>
                <th className="p-3.5">Locality & Source</th>
                <th className="p-3.5">Status / Stage</th>
                <th className="p-3.5">Courses & Batches</th>
                <th className="p-3.5">Assigned Caller</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D8B8]/60 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#78909C]">
                    <div className="inline-block animate-spin text-2xl text-[#D4AF37] mb-2">🪷</div>
                    <p>Loading Member Records...</p>
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#78909C]">
                    No members found matching the current filter criteria.
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
                            <span className="font-mono">+91 {person.mobile}</span>
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
                        ) : (
                          <span className="text-[11px] text-[#78909C] italic">No active batch</span>
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
                            title="Open 360° Profile"
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
