"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Layers,
} from "lucide-react";

interface Volunteer {
  id: string;
  name: string;
  role: string;
}

interface ImportCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCampaigns: string[];
  currentBatch: string;
  volunteers: Volunteer[];
  currentUserId?: string;
  currentUserName?: string;
  onSuccess: () => void;
}

export default function ImportCallingModal({
  isOpen,
  onClose,
  availableCampaigns,
  currentBatch,
  volunteers,
  currentUserId,
  currentUserName,
  onSuccess,
}: ImportCallingModalProps) {
  const [activeMode, setActiveMode] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [pastedText, setPastedText] = useState("");

  // Settings
  const [batchName, setBatchName] = useState(
    currentBatch && currentBatch !== "ALL" ? currentBatch : ""
  );
  const [assignMode, setAssignMode] = useState<"me" | "volunteer" | "unassigned">("me");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(currentUserId || "");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    updated: number;
    duplicates: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate and download a sample excel template
  const downloadSampleTemplate = () => {
    const sample = [
      {
        "Full Name": "Bhavesh Patel",
        "Mobile Number": "9825012345",
        "Area": "Chandkheda",
        "Profession": "Software Engineer",
      },
      {
        "Full Name": "Kalpesh Shah",
        "Mobile Number": "9898054321",
        "Area": "Motera",
        "Profession": "Business",
      },
      {
        "Full Name": "Rakesh Sharma",
        "Mobile Number": "9724098765",
        "Area": "Sabarmati",
        "Profession": "Teacher",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calling_List_Sample");
    XLSX.writeFile(wb, "Calling_List_Import_Template.xlsx");
  };

  // Parse Excel or CSV file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setError("The selected file is empty or contains no valid rows.");
          setParsedData([]);
          return;
        }

        setParsedData(rawData);
      } catch (err: any) {
        console.error("Error reading file:", err);
        setError("Failed to parse file. Please ensure it is a valid Excel or CSV file.");
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Parse pasted plain text (Name, Phone, City)
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setError("Please paste some contacts first.");
      return;
    }

    const lines = pastedText.split("\n").map((l) => l.trim()).filter(Boolean);
    const records: any[] = [];

    for (const line of lines) {
      // Split by comma, tab, or semicolon
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        records.push({
          "Full Name": parts[0],
          "Mobile Number": parts[1],
          "Area": parts[2] || "Chandkheda",
        });
      } else if (parts.length === 1 && /^[0-9]{10}$/.test(parts[0].replace(/[^0-9]/g, ""))) {
        records.push({
          "Full Name": "Devotee",
          "Mobile Number": parts[0],
          "Area": "Chandkheda",
        });
      }
    }

    if (records.length === 0) {
      setError("Could not extract names and numbers. Format: Name, Mobile, Area (one per line).");
      return;
    }

    setParsedData(records);
    setError(null);
  };

  // Perform Import
  const handleImport = async () => {
    if (parsedData.length === 0) {
      setError("No valid records found to import.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine assigned volunteer
      let assignVolunteerIds: string[] = [];
      if (assignMode === "me" && currentUserId) {
        assignVolunteerIds = [currentUserId];
      } else if (assignMode === "volunteer" && selectedVolunteerId) {
        assignVolunteerIds = [selectedVolunteerId];
      }

      const res = await fetch("/api/people/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: parsedData,
          batchTag: batchName.trim() || undefined,
          customSource: batchName.trim() ? `Calling Batch: ${batchName.trim()}` : "Calling List Import",
          assignVolunteerIds: assignVolunteerIds.length > 0 ? assignVolunteerIds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import contacts");
      }

      setResult({
        imported: data.imported || 0,
        updated: data.updated || 0,
        duplicates: data.duplicates || 0,
      });

      // Notify parent to refresh calling desk
      onSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import contacts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-[#E5D8B8] z-10 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#08415C]">
                Import Data for Calling Desk
              </h3>
              <p className="text-[11px] text-stone-500">
                Upload Excel / CSV or paste numbers to assign for calling campaigns
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already successfully imported */}
        {result ? (
          <div className="p-5 text-center space-y-4 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base text-emerald-950">Calling List Imported Successfully!</h4>
              <p className="text-xs text-emerald-800 mt-1">
                The contacts are now live and ready in the Calling Desk.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 max-w-sm mx-auto">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-xl font-bold text-emerald-700">{result.imported}</div>
                <div className="text-[10px] text-stone-500 font-semibold uppercase">New Contacts</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-xl font-bold text-[#08415C]">{result.updated}</div>
                <div className="text-[10px] text-stone-500 font-semibold uppercase">Assigned / Tagged</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-xl font-bold text-stone-500">{result.duplicates}</div>
                <div className="text-[10px] text-stone-500 font-semibold uppercase">Unchanged</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#08415C] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0B4F6C] transition"
            >
              Back to Calling Desk
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Selector Tabs */}
            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("file");
                  setParsedData([]);
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeMode === "file" ? "bg-white text-[#08415C] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel / CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode("paste");
                  setParsedData([]);
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeMode === "paste" ? "bg-white text-[#08415C] shadow-xs" : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Copy-Paste Text</span>
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {activeMode === "file" && (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-[#E5D8B8] hover:border-[#08415C] rounded-2xl p-6 text-center transition bg-[#FAF8F5]">
                  <UploadCloud className="w-10 h-10 text-[#08415C] mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-stone-800">
                    {selectedFile ? selectedFile.name : "Choose an Excel or CSV file to import"}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Supports .xlsx, .xls, .csv with columns: Name, Mobile, Area
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <label className="px-3.5 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition">
                      Browse File
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Sample Template</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Paste Text */}
            {activeMode === "paste" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold">Format: Name, Mobile, Area (One per line)</span>
                  <span className="text-[10px] text-stone-400">e.g. Bhavesh, 9825012345, Chandkheda</span>
                </div>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Bhavesh Patel, 9825012345, Chandkheda\nKalpesh Shah, 9898054321, Motera\nRakesh Sharma, 9724098765, Sabarmati`}
                  className="w-full p-3 font-mono text-xs bg-[#FAF8F5] border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C]"
                />
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition"
                >
                  Parse Contacts ({pastedText.split("\n").filter((l) => l.trim()).length} lines)
                </button>
              </div>
            )}

            {/* Calling Batch / Campaign Settings */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#08415C]" />
                  <span>Calling Batch / Campaign:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. BHAKTI FESTIVAL FOR YOUTH KATHWADA"
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#08415C]/20"
                  />
                  {availableCampaigns.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setBatchName(e.target.value);
                      }}
                      className="px-2 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-600"
                    >
                      <option value="">Existing Batches...</option>
                      {availableCampaigns.map((camp) => (
                        <option key={camp} value={camp}>
                          {camp}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Assignment Setting */}
              <div>
                <label className="font-bold text-stone-700 flex items-center gap-1.5 mb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#08415C]" />
                  <span>Assign Calls To:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignMode("me")}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-bold ${
                      assignMode === "me"
                        ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Myself ({currentUserName?.split(" ")[0] || "You"})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode("volunteer")}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-bold ${
                      assignMode === "volunteer"
                        ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Specific Caller
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignMode("unassigned")}
                    className={`py-1.5 px-2 rounded-xl border text-center transition font-bold ${
                      assignMode === "unassigned"
                        ? "bg-[#08415C] text-white border-[#08415C] shadow-xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    Unassigned Pool
                  </button>
                </div>

                {assignMode === "volunteer" && (
                  <select
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Select Volunteer Caller...</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.role.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Parsed Contacts Preview */}
            {parsedData.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-600 font-bold">
                  <span>Preview ({parsedData.length} devotees ready to import):</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">✓ Parsed Successfully</span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 bg-white">
                  {parsedData.slice(0, 15).map((row, idx) => {
                    const name = row["Full Name"] || row["Name"] || row["fullName"] || "Devotee";
                    const mobile =
                      row["Mobile Number"] || row["Mobile"] || row["Phone"] || row["mobile"] || "";
                    const area = row["Area"] || row["Locality"] || row["area"] || "";
                    return (
                      <div key={idx} className="px-3 py-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800">{name}</span>
                        <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
                          <span>{mobile}</span>
                          {area && <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">{area}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {parsedData.length > 15 && (
                  <p className="text-[10px] text-stone-400 text-center">
                    + {parsedData.length - 15} more devotees will be imported
                  </p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={parsedData.length === 0 || loading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                  parsedData.length > 0 && !loading
                    ? "bg-[#08415C] hover:bg-[#0B4F6C] text-white shadow-gold"
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
                <span>{loading ? "Importing Data..." : `Import ${parsedData.length} Contacts for Calling`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
