"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import * as XLSX from "xlsx";
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredPeople: any[];
  onImportSuccess: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  filteredPeople,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const handleExportExcel = () => {
    const exportData = filteredPeople.map((p, idx) => ({
      "Sr No": idx + 1,
      "Full Name": p.fullName,
      "Mobile Number": p.mobile,
      "WhatsApp Number": p.whatsappNumber || p.mobile,
      "Area / Locality": p.area || "",
      "Age Group": p.ageGroup || "",
      "Profession": p.profession || "",
      "Lead Source": p.source || "",
      "Current Stage": p.stage || "",
      "Assigned Calling Sewak": p.assignedVolunteer?.name || "Unassigned",
      "Relationship Steward": p.relationshipVolunteer?.name || "Unassigned",
      "Daily Japa Rounds": p.japaDailyRounds || 0,
      "Tags": p.tags || "",
      "Notes": p.notes || "",
      "Registered Date": new Date(p.createdAt).toLocaleDateString("en-IN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devotee Records");

    XLSX.writeFile(
      workbook,
      `Chandkheda_Spiritual_CRM_Export_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        // Send to backend import endpoint
        const res = await fetch("/api/people/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: rawData }),
        });

        const resData = await res.json();
        setImportResult({
          imported: resData.imported || 0,
          duplicates: resData.duplicates || 0,
        });
        onImportSuccess();
      } catch (err) {
        console.error("Import error:", err);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excel / CSV Data Management"
      subtitle="Export active filtered records or import existing rosters with duplicate detection"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("export")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "export"
                ? "bg-[#08415C] text-white shadow-sm"
                : "text-[#37474F] hover:bg-white"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Export Filtered Records
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === "import"
                ? "bg-[#08415C] text-white shadow-sm"
                : "text-[#37474F] hover:bg-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Import Excel / CSV
          </button>
        </div>

        {activeTab === "export" ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white border border-[#E5D8B8] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-[#08415C]">
                <span>Active Filtered Dataset:</span>
                <span className="text-[#B8860B]">{filteredPeople.length} Records</span>
              </div>
              <p className="text-[#78909C]">
                The exported file will strictly contain the records matching your current active filters (Area, Course, Batch, Volunteer, Regularity, etc.).
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="w-full py-3 bg-[#08415C] hover:bg-[#0B4F6C] text-white font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center justify-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
              Download Excel Spreadsheet (.xlsx)
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white border border-[#E5D8B8] rounded-xl space-y-2">
              <span className="font-semibold text-[#08415C]">Column Mapping Supported:</span>
              <p className="text-[#78909C]">
                Upload any standard Excel file containing columns: <code>Name</code>, <code>Mobile</code>, <code>Area</code>, <code>Source</code>, <code>Profession</code>.
              </p>
              <p className="text-[11px] text-[#B8860B]">
                🛡️ System automatically prevents duplicate mobile numbers.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#E5D8B8] hover:border-[#D4AF37] p-6 rounded-xl text-center bg-[#FAF8F5] transition">
              <input
                type="file"
                id="excelUpload"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={importing}
              />
              <label
                htmlFor="excelUpload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-[#08415C]" />
                <span className="font-semibold text-xs text-[#08415C]">
                  {importing ? "Processing & Importing..." : "Click to select Excel (.xlsx) or CSV file"}
                </span>
                <span className="text-[10px] text-[#78909C]">Max file size: 10MB</span>
              </label>
            </div>

            {importResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Successfully imported <strong>{importResult.imported}</strong> new records (Skipped <strong>{importResult.duplicates}</strong> existing duplicates).
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportExportModal;
