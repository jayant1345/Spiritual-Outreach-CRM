"use client";

import React, { useState } from "react";
import Modal from "@/components/common/Modal";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface BatchBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: {
    id: string;
    batchName: string;
    courseTitle?: string;
  } | null;
  members: any[];
  onSuccess: () => void;
}

export default function BatchBulkImportModal({
  isOpen,
  onClose,
  batch,
  members,
  onSuccess,
}: BatchBulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<"excel" | "directory">("excel");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Excel upload state
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");

  // Directory multi-select state
  const [directorySearch, setDirectorySearch] = useState<string>("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  if (!batch) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Full Name": "Ramesh Patel",
        "Mobile Number": "9876543210",
        "WhatsApp Number": "9876543210",
        "Area / Locality": "Bapunagar",
        "Profession": "Businessman",
        "Age Group": "30-45",
      },
      {
        "Full Name": "Jignesh Shah",
        "Mobile Number": "9123456780",
        "WhatsApp Number": "9123456780",
        "Area / Locality": "Chandkheda",
        "Profession": "Engineer",
        "Age Group": "18-30",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Enrollment Template");
    XLSX.writeFile(workbook, `Batch_Enrollment_${batch.batchName.replace(/\s+/g, "_")}_Template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);
        setParsedRows(rawData);
      } catch (err) {
        console.error("Excel parse error:", err);
        setStatusMessage({ type: "error", text: "Failed to read Excel file. Please verify file format." });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportExcelSubmit = async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/courses/batches/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batch.id,
          records: parsedRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `Successfully enrolled ${data.enrolled} devotees into ${batch.batchName} (${data.newMembers} newly registered, ${data.existingMembers} existing directory devotees linked)!`,
        });
        setParsedRows([]);
        setFileName("");
        onSuccess();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Failed to import rows." });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.message || "Network error during import." });
    } finally {
      setSubmitting(false);
    }
  };

  // Directory handlers
  const filteredDirectory = members.filter((m) => {
    const q = directorySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.mobile?.includes(q) ||
      m.area?.toLowerCase().includes(q) ||
      m.tags?.toLowerCase().includes(q)
    );
  });

  const toggleSelectPerson = (id: string) => {
    setSelectedPersonIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredDirectory.map((m) => m.id);
    const areAllSelected = allFilteredIds.every((id) => selectedPersonIds.includes(id));
    if (areAllSelected) {
      setSelectedPersonIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedPersonIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleEnrollDirectorySubmit = async () => {
    if (selectedPersonIds.length === 0) return;
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batch.id,
          personIds: selectedPersonIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: `Successfully enrolled ${data.enrolled} devotees into ${batch.batchName} and tagged them automatically!`,
        });
        setSelectedPersonIds([]);
        onSuccess();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Enrollment failed." });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStatusMessage(null);
        onClose();
      }}
      title={`Bulk Add Members: ${batch.batchName}`}
      subtitle={`Enroll multiple devotees into ${batch.courseTitle || "Course"} with automatic batch tagging`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("excel");
              setStatusMessage(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "excel" ? "bg-[#08415C] text-white shadow-xs" : "text-[#37474F] hover:bg-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("directory");
              setStatusMessage(null);
            }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "directory" ? "bg-[#08415C] text-white shadow-xs" : "text-[#37474F] hover:bg-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Select from Directory ({members.length})</span>
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-rose-50 border-rose-300 text-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="font-semibold">{statusMessage.text}</div>
          </div>
        )}

        {/* TAB 1: EXCEL IMPORT */}
        {activeTab === "excel" && (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-xl gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-900 block">Preaching / Contact List Roster</span>
                <span className="text-[11px] text-amber-800">
                  Upload newly collected devotee contacts or existing student lists. Missing devotees will be automatically created, and all will be enrolled &amp; tagged.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 font-bold rounded-lg hover:bg-amber-50 flex items-center gap-1.5 transition whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Sample Excel</span>
              </button>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-[#E5D8B8] hover:border-[#08415C] rounded-2xl p-6 text-center bg-[#FAF8F5] transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-[#08415C] mx-auto mb-2 opacity-80" />
              <p className="font-bold text-[#08415C]">
                {fileName ? fileName : "Click to select or drag & drop Excel / CSV file"}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Supports columns: Full Name, Mobile Number, WhatsApp, Area, Profession</p>
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-stone-700 font-bold">
                  <span>Detected {parsedRows.length} Devotee Rows in File:</span>
                  <span className="text-emerald-700 font-normal">Ready to Enroll</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-xl divide-y bg-white">
                  {parsedRows.slice(0, 10).map((r, i) => (
                    <div key={i} className="p-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#08415C]">
                        {r["Full Name"] || r["Name"] || "Devotee"}
                      </span>
                      <span className="font-mono text-stone-600">
                        {r["Mobile Number"] || r["Mobile"] || r["Phone"] || "—"}
                      </span>
                      <span className="text-stone-500">{r["Area / Locality"] || r["Area"] || "—"}</span>
                    </div>
                  ))}
                  {parsedRows.length > 10 && (
                    <div className="p-2 text-center text-[10px] text-stone-400 font-semibold bg-stone-50">
                      + {parsedRows.length - 10} more devotees
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName("");
                    }}
                    className="px-3.5 py-2 border rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                  >
                    Clear File
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleImportExcelSubmit}
                    className="px-4 py-2 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl font-bold shadow-gold flex items-center gap-1.5 transition disabled:opacity-60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{submitting ? "Importing & Enrolling..." : `Enroll All ${parsedRows.length} Devotees`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIRECTORY MULTI-SELECT */}
        {activeTab === "directory" && (
          <div className="space-y-3">
            {/* Search and Select All Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search devotees by name, phone, or area..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none focus:border-[#08415C]"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-2 border border-stone-200 bg-white rounded-xl font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 whitespace-nowrap"
              >
                {filteredDirectory.length > 0 &&
                filteredDirectory.every((m) => selectedPersonIds.includes(m.id)) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#00A896]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span>Select All ({filteredDirectory.length})</span>
              </button>
            </div>

            {/* Devotees List */}
            <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-xl divide-y bg-white">
              {filteredDirectory.length === 0 ? (
                <div className="p-6 text-center text-stone-400">No matching devotees found.</div>
              ) : (
                filteredDirectory.map((m) => {
                  const isChecked = selectedPersonIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleSelectPerson(m.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                        isChecked ? "bg-amber-50/60" : "hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#00A896] flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-300 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#08415C] truncate">{m.fullName}</div>
                          <div className="text-[11px] text-stone-500 font-mono">
                            +91 {m.mobile} {m.area ? `• ${m.area}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {m.stage}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-500 font-semibold">
                <strong>{selectedPersonIds.length}</strong> devotee(s) selected
              </span>
              <button
                type="button"
                disabled={submitting || selectedPersonIds.length === 0}
                onClick={handleEnrollDirectorySubmit}
                className="px-4 py-2 bg-[#08415C] hover:bg-[#063349] text-white rounded-xl font-bold shadow-gold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {submitting ? "Enrolling..." : `Enroll Selected (${selectedPersonIds.length})`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
