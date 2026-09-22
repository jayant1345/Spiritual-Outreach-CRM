/**
 * Dynamic WhatsApp Template & Click-to-Chat Resolver
 * Zero-cost volunteer tool generating instant web/mobile links
 */

export interface TemplateContext {
  name?: string;
  mobile?: string;
  program_name?: string;
  course_name?: string;
  session_no?: string | number;
  date?: string;
  time?: string;
  venue?: string;
  topic?: string;
  recording_link?: string;
  next_session_date?: string;
  coordinator_name?: string;
  coordinator_phone?: string;
  [key: string]: any;
}

export function resolveWhatsAppTemplate(templateText: string, context: TemplateContext): string {
  let resolved = templateText;

  // Replace each standard placeholder {{variable}}
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      resolved = resolved.replace(regex, String(value));
    }
  }

  return resolved;
}

export function buildWhatsAppUrl(phoneNumber: string, messageText: string): string {
  // Clean phone number (strip spaces, dashes, parentheses, plus sign)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

  // Add India country code (91) if not already present
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }

  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
