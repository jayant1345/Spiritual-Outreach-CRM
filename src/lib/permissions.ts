export type UserRole =
  | "SUPER_ADMIN"
  | "COORDINATOR"
  | "CALLING_VOLUNTEER"
  | "RELATIONSHIP_VOLUNTEER";

export type PermissionKey =
  | "devotees:view_all"
  | "devotees:create"
  | "devotees:edit"
  | "devotees:delete"
  | "devotees:export"
  | "devotees:import"
  | "calling:view"
  | "calling:log"
  | "calling:assign"
  | "whatsapp:send"
  | "whatsapp:manage"
  | "courses:manage"
  | "programs:manage"
  | "sadhana:manage"
  | "reports:view"
  | "reports:export"
  | "users:manage"
  | "settings:manage";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: "Devotees" | "Calling & Outreach" | "Learning & Sadhana" | "Administration";
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Devotees
  {
    key: "devotees:view_all",
    label: "View All Devotees",
    category: "Devotees",
    description: "Browse master database of all devotees across the entire center (unrestricted)",
  },
  {
    key: "devotees:create",
    label: "Add New Devotee",
    category: "Devotees",
    description: "Register new seekers/devotees into the CRM",
  },
  {
    key: "devotees:edit",
    label: "Edit Devotee Profiles",
    category: "Devotees",
    description: "Update devotee personal info, stage, mentor, notes, and contacts",
  },
  {
    key: "devotees:delete",
    label: "Delete Devotee Records",
    category: "Devotees",
    description: "Permanently delete devotee profiles from the database",
  },
  {
    key: "devotees:export",
    label: "Export Devotee Data",
    category: "Devotees",
    description: "Download filtered devotee records as Excel / CSV spreadsheet",
  },
  {
    key: "devotees:import",
    label: "Import Devotee Roster",
    category: "Devotees",
    description: "Bulk upload contacts and registrations via Excel sheet",
  },

  // Calling & Outreach
  {
    key: "calling:view",
    label: "Access Calling Desk",
    category: "Calling & Outreach",
    description: "View calling queues, today's work, and assigned contact lists",
  },
  {
    key: "calling:log",
    label: "Log Calls & Follow-ups",
    category: "Calling & Outreach",
    description: "Record calling dispositions, notes, and schedule next follow-up dates",
  },
  {
    key: "calling:assign",
    label: "Assign Calling Tasks",
    category: "Calling & Outreach",
    description: "Allocate contacts, campaigns, and queues to calling volunteers",
  },
  {
    key: "whatsapp:send",
    label: "Send WhatsApp Messages",
    category: "Calling & Outreach",
    description: "Send 1-on-1 and templated messages via WhatsApp wa.me links",
  },
  {
    key: "whatsapp:manage",
    label: "Manage WhatsApp Templates",
    category: "Calling & Outreach",
    description: "Create, edit, and organize devotional broadcast message templates",
  },

  // Learning & Sadhana
  {
    key: "courses:manage",
    label: "Manage Courses & Batches",
    category: "Learning & Sadhana",
    description: "Create courses, manage batches, enroll devotees, and mark attendance",
  },
  {
    key: "programs:manage",
    label: "Manage Programs & Events",
    category: "Learning & Sadhana",
    description: "Set up temple festivals, Sunday Feast RSVPs, and track program turnouts",
  },
  {
    key: "sadhana:manage",
    label: "Track Sadhana & Japa",
    category: "Learning & Sadhana",
    description: "Log daily chanting rounds (Mala logger) and spiritual growth milestones",
  },

  // Administration
  {
    key: "reports:view",
    label: "View Reports & Analytics",
    category: "Administration",
    description: "Access high-level dashboards, calling effectiveness, and center stats",
  },
  {
    key: "reports:export",
    label: "Export Analytics Reports",
    category: "Administration",
    description: "Export operational metrics and attendance statistics to spreadsheets",
  },
  {
    key: "users:manage",
    label: "Manage Users & Access Rights",
    category: "Administration",
    description: "Create team members, assign hierarchy roles, and toggle access permissions",
  },
  {
    key: "settings:manage",
    label: "System Settings & Configuration",
    category: "Administration",
    description: "Configure system options, stage pipelines, and temple parameters",
  },
];

export const ROLE_HIERARCHY: Record<UserRole, { title: string; tier: number; badgeColor: string; description: string }> = {
  SUPER_ADMIN: {
    title: "Super Admin (Temple President / Management)",
    tier: 4,
    badgeColor: "bg-[#08415C] text-white border-[#D4AF37]",
    description: "Unrestricted master access. Full view, add, edit, delete, export, and user role configuration across the entire CRM.",
  },
  COORDINATOR: {
    title: "Coordinator (Department Head / Team Lead)",
    tier: 3,
    badgeColor: "bg-emerald-700 text-white border-emerald-500",
    description: "Operational leadership. Can view all devotees, assign callers, manage courses & events, export data, and manage volunteers.",
  },
  RELATIONSHIP_VOLUNTEER: {
    title: "Relationship Volunteer (Devotee Counselor / Mentor)",
    tier: 2,
    badgeColor: "bg-amber-600 text-white border-amber-400",
    description: "Devotee care stewardship. Views and guides assigned counselees, logs sadhana, tracks attendance, and updates interaction notes.",
  },
  CALLING_VOLUNTEER: {
    title: "Calling Volunteer (Tele-Calling Sewak)",
    tier: 1,
    badgeColor: "bg-blue-600 text-white border-blue-400",
    description: "Outreach caller. Dedicated access to assigned calling queues, call logs, and follow-ups. Cannot delete or export devotee databases.",
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map((p) => p.key),
  COORDINATOR: [
    "devotees:view_all",
    "devotees:create",
    "devotees:edit",
    "devotees:delete",
    "devotees:export",
    "devotees:import",
    "calling:view",
    "calling:log",
    "calling:assign",
    "whatsapp:send",
    "whatsapp:manage",
    "courses:manage",
    "programs:manage",
    "sadhana:manage",
    "reports:view",
    "reports:export",
    "users:manage",
  ],
  RELATIONSHIP_VOLUNTEER: [
    "calling:view",
    "calling:log",
    "whatsapp:send",
    "courses:manage",
    "sadhana:manage",
    "devotees:edit",
  ],
  CALLING_VOLUNTEER: [
    "calling:view",
    "calling:log",
    "whatsapp:send",
  ],
};

export function getEffectivePermissions(role?: string | null, customPrivileges?: string[] | null): PermissionKey[] {
  const normalizedRole = (role as UserRole) || "CALLING_VOLUNTEER";
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[normalizedRole] || [];

  if (!customPrivileges || !Array.isArray(customPrivileges) || customPrivileges.length === 0) {
    return defaultPerms;
  }

  // Combine and deduplicate
  const set = new Set<PermissionKey>([...defaultPerms, ...(customPrivileges as PermissionKey[])]);
  return Array.from(set);
}

export function hasPermission(
  user: { role?: string | null; privileges?: string[] | null } | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user || !user.role) return false;
  if (user.role === "SUPER_ADMIN") return true;

  const perms = getEffectivePermissions(user.role, user.privileges);
  return perms.includes(permission);
}
