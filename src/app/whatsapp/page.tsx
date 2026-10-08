"use client";

import React, { useState, useEffect, useRef } from "react";
import Badge from "@/components/common/Badge";
import { Modal } from "@/components/common/Modal";
import { resolveWhatsAppTemplate, buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  MessageSquare,
  Plus,
  Copy,
  Check,
  Send,
  Sparkles,
  ExternalLink,
  Pencil,
  Trash2,
  CopyPlus,
  Info,
} from "lucide-react";

const TEMPLATE_CATEGORIES = [
  { id: "PROGRAM_INVITE", label: "Program Invite", badge: "ocean" },
  { id: "COURSE_REMINDER", label: "Course Reminder", badge: "emerald" },
  { id: "ABSENTEE_FOLLOWUP", label: "Absentee Follow-up", badge: "amber" },
  { id: "FESTIVAL_GREETING", label: "Festival Greeting", badge: "rose" },
  { id: "RELATIONSHIP", label: "Relationship Care", badge: "morpankh" },
  { id: "GENERAL", label: "General", badge: "stone" },
] as const;

const AVAILABLE_VARIABLES = [
  { tag: "{{name}}", desc: "Devotee Name", sample: "Rahul Patel" },
  { tag: "{{course_name}}", desc: "Course Name", sample: "Gita Shiksha Course" },
  { tag: "{{session_no}}", desc: "Session #", sample: "5" },
  { tag: "{{date}}", desc: "Date", sample: "Sunday, 28 Sept 2026" },
  { tag: "{{time}}", desc: "Time", sample: "5:00 PM – 7:30 PM" },
  { tag: "{{venue}}", desc: "Venue", sample: "Main Satsang Hall" },
  { tag: "{{topic}}", desc: "Topic", sample: "Supreme Goal of Life" },
  { tag: "{{recording_link}}", desc: "Recording URL", sample: "https://youtu.be/sample-link" },
  { tag: "{{next_session_date}}", desc: "Next Session", sample: "Sunday 5:30 PM" },
  { tag: "{{coordinator_name}}", desc: "Coordinator", sample: "Amit Kumar" },
  { tag: "{{coordinator_phone}}", desc: "Phone", sample: "+91 98250 12345" },
];

export default function WhatsAppStudioPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [testName, setTestName] = useState("Rahul Patel");
  const [testPhone, setTestPhone] = useState("9876543210");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("PROGRAM_INVITE");
  const [formBodyText, setFormBodyText] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/templates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate((prev: any) => {
            if (prev) {
              const matched = data.find((t: any) => t.id === prev.id);
              return matched || data[0];
            }
            return data[0];
          });
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates =
    selectedCategory === "ALL"
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

  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setEditingTemplateId(null);
    setFormName("");
    setFormCategory(selectedCategory === "ALL" ? "PROGRAM_INVITE" : selectedCategory);
    setFormBodyText("Hare Krishna {{name}} Ji! 🙏\n\n");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: any) => {
    setModalMode("EDIT");
    setEditingTemplateId(tpl.id);
    setFormName(tpl.name);
    setFormCategory(tpl.category);
    setFormBodyText(tpl.bodyText);
    setIsModalOpen(true);
  };

  const handleOpenDuplicateModal = (tpl: any) => {
    setModalMode("CREATE");
    setEditingTemplateId(null);
    setFormName(`${tpl.name} (Copy)`);
    setFormCategory(tpl.category);
    setFormBodyText(tpl.bodyText);
    setIsModalOpen(true);
  };

  const handleInsertVariable = (variableTag: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formBodyText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + variableTag + after;
      setFormBodyText(newText);

      // Restore focus and cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableTag.length, start + variableTag.length);
      }, 50);
    } else {
      setFormBodyText((prev) => prev + " " + variableTag);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBodyText.trim()) {
      alert("Please enter a template name and message body.");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "CREATE") {
        const res = await fetch("/api/whatsapp/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory,
            bodyText: formBodyText.trim(),
            variablesList: ["name", "date", "venue"],
          }),
        });

        if (!res.ok) throw new Error("Failed to create template");
        const newTemplate = await res.json();
        setTemplates((prev) => [newTemplate, ...prev]);
        setSelectedTemplate(newTemplate);
        setIsModalOpen(false);
      } else if (modalMode === "EDIT" && editingTemplateId) {
        const res = await fetch(`/api/whatsapp/templates/${editingTemplateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory,
            bodyText: formBodyText.trim(),
          }),
        });

        if (!res.ok) throw new Error("Failed to update template");
        const updated = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        if (selectedTemplate?.id === updated.id) {
          setSelectedTemplate(updated);
        }
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (tpl: any) => {
    if (!tpl) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tpl.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/whatsapp/templates/${tpl.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template");

      setTemplates((prev) => {
        const next = prev.filter((t) => t.id !== tpl.id);
        if (selectedTemplate?.id === tpl.id) {
          setSelectedTemplate(next[0] || null);
        }
        return next;
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete template.");
    }
  };

  // Preview of the message being edited in the modal
  const modalResolvedPreview = resolveWhatsAppTemplate(formBodyText, context);

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
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ Create New Template</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            selectedCategory === "ALL"
              ? "bg-[#08415C] text-white shadow-sm"
              : "bg-white border border-[#E5D8B8] text-[#37474F] hover:bg-[#FAF8F5]"
          }`}
        >
          All Templates ({templates.length})
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = templates.filter((t) => t.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-[#08415C] text-white shadow-sm"
                  : "bg-white border border-[#E5D8B8] text-[#37474F] hover:bg-[#FAF8F5]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split View: Left (Library) | Right (Live Editor & Phone Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Template Library */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gold-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#08415C] uppercase tracking-wider">
                Template Library ({filteredTemplates.length})
              </h3>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs text-[#08415C] hover:text-[#0B4F6C] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Add New
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#78909C]">
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#78909C] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E5D8B8] space-y-2">
                <p>No templates found in this category.</p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3 py-1.5 bg-[#08415C] text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Create First Template
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs relative group ${
                      selectedTemplate?.id === tpl.id
                        ? "bg-[#FAF5E6] border-[#D4AF37] ring-1 ring-[#D4AF37]"
                        : "bg-white border-[#E5D8B8] hover:border-[#D4AF37]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="font-semibold text-[#08415C] line-clamp-1">
                        {tpl.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge variant="morpankh" size="sm">
                          {tpl.category.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[#78909C] line-clamp-2 mt-1 leading-relaxed">
                      {tpl.bodyText}
                    </p>

                    {/* Quick Action Icons on Card */}
                    <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Click to preview</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(tpl);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium flex items-center gap-1 transition"
                          title="Edit this template"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDuplicateModal(tpl);
                          }}
                          className="px-2 py-0.5 rounded bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100 font-medium flex items-center gap-1 transition"
                          title="Duplicate this template"
                        >
                          <CopyPlus className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Live Phone Simulator & Editor */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTemplate ? (
            <div className="gold-card p-4 sm:p-5 space-y-5">
              {/* Header with Title, Category, and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5D8B8]/70 pb-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif font-bold text-base sm:text-lg text-[#08415C]">
                      {selectedTemplate.name}
                    </h4>
                    <Badge variant="morpankh" size="sm">
                      {selectedTemplate.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#78909C] mt-0.5">
                    Click <strong>Edit Message</strong> to update text, links, or placeholders
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => handleOpenEditModal(selectedTemplate)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    title="Edit Template text and details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Message</span>
                  </button>

                  {/* DUPLICATE BUTTON */}
                  <button
                    onClick={() => handleOpenDuplicateModal(selectedTemplate)}
                    className="px-2.5 py-1.5 bg-white border border-[#E5D8B8] hover:bg-[#FAF8F5] text-xs font-semibold text-[#37474F] rounded-lg transition"
                    title="Duplicate as new template"
                  >
                    <CopyPlus className="w-3.5 h-3.5" />
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate)}
                    className="px-2.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 rounded-lg transition"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* COPY BUTTON */}
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white border border-[#E5D8B8] text-xs font-semibold text-[#37474F] rounded-lg hover:bg-[#FAF8F5] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#00A896]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>

                  {/* TEST LAUNCH BUTTON */}
                  <a
                    href={buildWhatsAppUrl(testPhone, resolvedMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-semibold rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Test Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Devotee Variable Resolver Preview Pill */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E5D8B8]">
                <div className="flex items-center gap-1 font-semibold text-[#08415C]">
                  <span>Testing with Devotee:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="px-2 py-1 bg-white border border-[#E5D8B8] rounded text-xs font-medium flex-1 sm:w-36 focus:outline-none focus:border-[#08415C]"
                    placeholder="Devotee Name"
                  />
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="px-2 py-1 bg-white border border-[#E5D8B8] rounded text-xs font-medium flex-1 sm:w-32 focus:outline-none focus:border-[#08415C]"
                    placeholder="10-digit phone"
                  />
                </div>
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
            <div className="p-12 text-center text-xs text-[#78909C] bg-white border border-[#E5D8B8] rounded-2xl">
              Select a template to preview live.
            </div>
          )}
        </div>
      </div>

      {/* CREATE & EDIT TEMPLATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "CREATE" ? "Create New WhatsApp Template" : "Edit WhatsApp Template"}
        subtitle="Craft dynamic broadcast messages with variable placeholders and live preview"
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveTemplate} className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Template Name */}
            <div>
              <label className="block text-xs font-bold text-[#08415C] mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Absent Student Check-in & Video Link"
                className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#08415C] mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5D8B8] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#08415C]"
              >
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Insert Variables Toolbar */}
          <div className="space-y-1.5 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Click any placeholder to insert into message:
              </span>
              <span className="text-stone-500 font-normal hidden sm:inline">
                Auto-replaces with devotee data
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-mono font-semibold text-amber-900 shadow-2xs transition active:scale-95"
                  title={`Inserts ${v.tag} (${v.desc})`}
                >
                  + {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-Side: Editor (Left) & Real-time Resolved Preview (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Editor Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-[#08415C]">
                  Message Body Text <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-stone-400">
                  {formBodyText.length} characters
                </span>
              </div>
              <textarea
                ref={textareaRef}
                required
                rows={11}
                value={formBodyText}
                onChange={(e) => setFormBodyText(e.target.value)}
                placeholder="Type your message here with {{name}}, *bold text*, etc..."
                className="w-full p-3 bg-white border border-[#E5D8B8] rounded-xl text-xs font-sans text-[#0B192C] focus:outline-none focus:border-[#08415C] resize-none leading-relaxed"
              />
              <p className="text-[10px] text-[#78909C]">
                Format tips: *bold*, _italic_, ~strike~. Line breaks will be preserved in WhatsApp.
              </p>
            </div>

            {/* Real-time Preview Bubble */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#08415C]">
                Live Preview (What Devotee Sees):
              </label>
              <div className="bg-[#E5DDD5] p-3 rounded-xl border border-[#D4AF37]/40 min-h-[220px] max-h-[250px] overflow-y-auto">
                <div className="bg-[#DCF8C6] text-[#0B192C] text-xs p-3 rounded-xl rounded-tr-none shadow-xs whitespace-pre-wrap leading-relaxed border border-[#C5E1A5]/50">
                  {modalResolvedPreview || (
                    <span className="text-stone-400 italic">
                      Start typing to see the live WhatsApp preview...
                    </span>
                  )}
                  <div className="text-[9px] text-gray-500 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>11:42 AM</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[#E5D8B8]/70 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#08415C] hover:bg-[#0B4F6C] text-white text-xs font-bold rounded-xl shadow-gold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : modalMode === "CREATE" ? (
                <>
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Create Template</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
