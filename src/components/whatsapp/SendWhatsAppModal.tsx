"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { resolveWhatsAppTemplate, buildWhatsAppUrl } from "@/lib/whatsapp";
import { Send, Copy, Check, MessageSquare, Sparkles, ExternalLink } from "lucide-react";

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    id: string;
    fullName: string;
    mobile: string;
    area?: string;
  } | null;
  onSentSuccess?: () => void;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
  isOpen,
  onClose,
  person,
  onSentSuccess,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [messageText, setMessageText] = useState<string>("");
  const [autoLogTimeline, setAutoLogTimeline] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/whatsapp/templates");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
        setSelectedTemplateId(data[0].id);
        applyTemplate(data[0], person);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const applyTemplate = (template: any, targetPerson: any) => {
    if (!template || !targetPerson) return;
    const context = {
      name: targetPerson.fullName,
      mobile: targetPerson.mobile,
      program_name: "Bhagavad Gita Introduction Seminar",
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
    const resolved = resolveWhatsAppTemplate(template.bodyText, context);
    setMessageText(resolved);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = templates.find((t) => t.id === templateId);
    if (found && person) {
      applyTemplate(found, person);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    if (!person || !person.mobile) return;
    setLoading(true);

    try {
      // 1. Log to database if enabled
      if (autoLogTimeline) {
        await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId: person.id,
            templateId: selectedTemplateId || null,
            messageBody: messageText,
          }),
        });
      }

      // 2. Open WhatsApp click-to-chat URL
      const waUrl = buildWhatsAppUrl(person.mobile, messageText);
      window.open(waUrl, "_blank");

      if (onSentSuccess) onSentSuccess();
      onClose();
    } catch (err) {
      console.error("Error logging WhatsApp send:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!person) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Message"
      subtitle={`Connecting with ${person.fullName} (${person.mobile}) via Free Click-to-Chat`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#08415C] mb-1.5">
            Select Message Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5D8B8] rounded-xl text-sm text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C]"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                [{tpl.category.replace("_", " ")}] {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#08415C]">
              Message Text (Dynamic Variables Resolved)
            </label>
            <span className="text-[11px] text-[#78909C] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Auto-customized for {person.fullName}
            </span>
          </div>
          <textarea
            rows={7}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full p-3.5 bg-white border border-[#E5D8B8] rounded-xl text-sm text-[#0B192C] focus:outline-none focus:ring-2 focus:ring-[#08415C]/20 focus:border-[#08415C] font-sans leading-relaxed"
            placeholder="Type your WhatsApp message..."
          />
        </div>

        {/* Live WhatsApp Bubble Preview */}
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5D8B8]/80">
          <p className="text-xs font-semibold text-[#08415C] mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#00A896]" /> Live WhatsApp Chat Preview
          </p>
          <div className="bg-[#EFEAE2] p-3 rounded-lg border border-[#E0D8C8]">
            <div className="bg-[#DCF8C6] text-[#0B192C] text-xs p-3 rounded-lg rounded-tr-none shadow-sm max-w-[90%] ml-auto whitespace-pre-wrap leading-relaxed border border-[#C5E1A5]/40">
              {messageText}
              <div className="text-[10px] text-gray-500 text-right mt-1 flex items-center justify-end gap-1">
                <span>Just now</span>
                <span className="text-blue-500 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="autolog"
            checked={autoLogTimeline}
            onChange={(e) => setAutoLogTimeline(e.target.checked)}
            className="w-4 h-4 text-[#08415C] rounded border-[#E5D8B8] focus:ring-[#08415C]"
          />
          <label htmlFor="autolog" className="text-xs font-medium text-[#37474F]">
            Automatically log this message to {person.fullName}&apos;s 360° timeline
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5D8B8]/60">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E5D8B8] text-xs font-semibold text-[#37474F] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-[#00A896]" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Text"}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E5D8B8] text-xs font-semibold text-[#78909C] hover:bg-[#FAF8F5]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#08415C] hover:bg-[#0B4F6C] text-[#FFFFFF] text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4 text-[#D4AF37]" />
              {loading ? "Launching..." : "Launch WhatsApp (Web/App)"}
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SendWhatsAppModal;
