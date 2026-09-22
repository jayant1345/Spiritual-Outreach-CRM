"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import { resolveWhatsAppTemplate, buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  MessageSquare,
  Plus,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Smartphone,
  Eye,
} from "lucide-react";

export default function WhatsAppStudioPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [testName, setTestName] = useState("Rahul Patel");
  const [testPhone, setTestPhone] = useState("9876543210");
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newCategory, setNewCategory] = useState("PROGRAM_INVITE");
  const [newBodyText, setNewBodyText] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/whatsapp/templates");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = selectedCategory === "ALL"
    ? templates
    : templates.filter((t) => t.category === selectedCategory);

  const context = {
    name: testName,
    program_name: "Bhagavad Gita Intro Seminar",
    course_name: "Gita Shiksha Course (Batch 1)",
    session_no: "5",
    date: "Sunday, 28 September 2026",
    time: "5:00 PM – 7:30 PM",
    venue: "Main Satsang Hall, Chandkheda Center",
    topic: "Supreme Goal of Life & Practical Bhakti",
    recording_link: "https://youtu.be/chandkheda-gita-recording",
    next_session_date: "Sunday 5:30 PM",
    coordinator_name: "Amit Kumar (Sewa Coordinator)",
    coordinator_phone: "+91 98250 12345",
  };

  const resolvedMessage = selectedTemplate
    ? resolveWhatsAppTemplate(selectedTemplate.bodyText, context)
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim() || !newBodyText.trim()) return;

    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          category: newCategory,
          bodyText: newBodyText,
          variablesList: ["name", "date", "venue"],
        }),
      });
      const data = await res.json();
      setTemplates((prev) => [data, ...prev]);
      setSelectedTemplate(data);
      setIsCreating(false);
      setNewTemplateName("");
      setNewBodyText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
            WhatsApp Templates & Click-to-Chat Broadcast Studio
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Zero-cost volunteer communication engine with dynamic variable placeholders and real-time phone simulator
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ Create New Template</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Templates" },
          { id: "PROGRAM_INVITE", label: "Program Invites" },
          { id: "COURSE_REMINDER", label: "Course Reminders" },
          { id: "ABSENTEE_FOLLOWUP", label: "Absentee Follow-up" },
          { id: "FESTIVAL_GREETING", label: "Festival Greetings" },
          { id: "RELATIONSHIP", label: "Relationship Care" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? "bg-[#08415C] text-white shadow-sm"
                : "bg-white border border-[#E5D8B8] text-[#37474F] hover:bg-[#FAF8F5]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Split View: Left (Library) | Right (Live Editor & Phone Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Template Library */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gold-card p-4 space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#08415C] uppercase tracking-wider">
              Template Library ({filteredTemplates.length})
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    selectedTemplate?.id === tpl.id
                      ? "bg-[#FAF5E6] border-[#D4AF37] ring-1 ring-[#D4AF37]"
                      : "bg-white border-[#E5D8B8] hover:border-[#D4AF37]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#08415C] line-clamp-1">
                      {tpl.name}
                    </span>
                    <Badge variant="morpankh" size="sm">
                      {tpl.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[#78909C] line-clamp-2 mt-1 leading-relaxed">
                    {tpl.bodyText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Phone Simulator & Editor */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTemplate ? (
            <div className="gold-card p-5 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#E5D8B8]/70 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#08415C]">
                    {selectedTemplate.name}
                  </h4>
                  <p className="text-xs text-[#78909C]">
                    Category: {selectedTemplate.category.replace("_", " ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white border border-[#E5D8B8] text-xs font-semibold text-[#37474F] rounded-lg hover:bg-[#FAF8F5] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00A896]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <a
                    href={buildWhatsAppUrl(testPhone, resolvedMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Test Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Devotee Variable Resolver Preview Pill */}
              <div className="flex items-center gap-2 text-xs bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5D8B8]">
                <span className="font-semibold text-[#08415C]">Testing with Devotee:</span>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#E5D8B8] rounded text-xs font-medium w-36"
                  placeholder="Devotee Name"
                />
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#E5D8B8] rounded text-xs font-medium w-32"
                  placeholder="10-digit phone"
                />
              </div>

              {/* Simulated Phone Screen */}
              <div className="bg-[#EFEAE2] p-4 sm:p-6 rounded-2xl border-2 border-[#D4AF37]/40 shadow-inner max-w-lg mx-auto">
                {/* Mock Phone Header */}
                <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
                      {testName[0] || "D"}
                    </div>
                    <div>
                      <div className="font-semibold">{testName}</div>
                      <div className="text-[10px] text-green-200">+91 {testPhone} • Online</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">WhatsApp</span>
                </div>

                {/* Chat Body */}
                <div className="bg-[#E5DDD5] p-4 rounded-b-xl min-h-[260px] space-y-3">
                  <div className="text-center">
                    <span className="text-[10px] bg-white/80 text-gray-600 px-2 py-0.5 rounded-full shadow-xs">
                      TODAY
                    </span>
                  </div>

                  {/* Outgoing Chat Bubble */}
                  <div className="bg-[#DCF8C6] text-[#0B192C] text-xs p-3.5 rounded-xl rounded-tr-none shadow-sm ml-auto whitespace-pre-wrap leading-relaxed border border-[#C5E1A5]/50 max-w-[92%]">
                    {resolvedMessage}
                    <div className="text-[10px] text-gray-500 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>11:42 AM</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#78909C]">
              Select a template to preview live.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
