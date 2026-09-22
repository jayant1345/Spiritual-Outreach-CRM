"use client";

import React, { useState, useEffect } from "react";
import Badge from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
import { UserCog, Phone, Mail, CheckCircle2, PhoneCall, Plus, Shield, Key, UserCheck, UserX, HeartHandshake, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function VolunteersPage() {
  const { user: currentUser, isCoordinator } = useAuth();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "CALLING_VOLUNTEER",
    password: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setVolunteers(data);
      } else {
        const fbRes = await fetch("/api/volunteers");
        const fbData = await fbRes.json();
        if (Array.isArray(fbData)) setVolunteers(fbData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create user");
      } else {
        setIsAddUserOpen(false);
        setFormData({
          name: "",
          username: "",
          email: "",
          phone: "",
          role: "CALLING_VOLUNTEER",
          password: "",
        });
        fetchUsers();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    if (!confirm(`Are you sure you want to ${user.active ? "deactivate" : "activate"} ${user.name}?`)) return;

    try {
      await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      await fetch("/api/auth/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUserForPassword.id, newPassword }),
      });
      setIsPasswordModalOpen(false);
      setNewPassword("");
      alert(`Password updated for ${selectedUserForPassword.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "morpankh";
      case "COORDINATOR":
        return "emerald";
      case "CALLING_VOLUNTEER":
        return "blue";
      case "RELATIONSHIP_VOLUNTEER":
        return "gold";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#08415C] flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-[#D4AF37]" />
            Team & User Management
          </h2>
          <p className="text-xs text-[#78909C] mt-0.5">
            Manage user logins, passwords, permissions, and assigned devotee care capacity for Chandkheda Center
          </p>
        </div>

        {isCoordinator && (
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 bg-[#08415C] hover:bg-[#063349] text-white text-xs font-semibold rounded-xl border border-[#D4AF37]/50 shadow-gold flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Create New User / Volunteer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {volunteers.map((vol) => (
          <div key={vol.id} className="gold-card p-5 space-y-4 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#08415C] text-[#D4AF37] flex items-center justify-center border-2 border-[#D4AF37]/50 shadow-sm flex-shrink-0">
                    <User className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#08415C] flex items-center gap-1.5">
                      {vol.name}
                      {vol.active === false && (
                        <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-sans">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] text-stone-500 font-mono">@{vol.username || "no-username"}</div>
                  </div>
                </div>

                <Badge variant={getRoleVariant(vol.role) as any} size="sm">
                  {vol.role.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="text-xs text-[#78909C] space-y-1.5 pt-1">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#08415C] flex-shrink-0" />
                  <span className="truncate">{vol.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#00A896] flex-shrink-0" />
                  <span>{vol.phone || "+91 98250 12345"}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-[#E5D8B8]/60">
                <div className="p-2 bg-[#FAF8F5] rounded-xl border border-[#E5D8B8]">
                  <div className="font-bold text-[#08415C]">
                    {(vol._count?.assignedPeople || 0) + (vol._count?.relationshipPeople || 0)}
                  </div>
                  <div className="text-[10px] text-[#78909C]">Allotted Devotees</div>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-800">{vol._count?.callLogs || 0}</div>
                  <div className="text-[10px] text-emerald-600">Calls Done</div>
                </div>
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-800">{vol._count?.followups || 0}</div>
                  <div className="text-[10px] text-amber-600">Pending Tasks</div>
                </div>
              </div>
            </div>

            {isCoordinator && (
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
                <select
                  value={vol.role}
                  onChange={(e) => handleRoleChange(vol.id, e.target.value)}
                  className="text-[11px] font-semibold bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none text-stone-700"
                >
                  <option value="SUPER_ADMIN">👑 Super Admin</option>
                  <option value="COORDINATOR">🛠️ Coordinator</option>
                  <option value="CALLING_VOLUNTEER">📞 Caller</option>
                  <option value="RELATIONSHIP_VOLUNTEER">🤝 Counselor</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForPassword(vol);
                      setIsPasswordModalOpen(true);
                    }}
                    className="p-1.5 text-stone-500 hover:text-[#08415C] hover:bg-[#08415C]/10 rounded-lg transition"
                    title="Reset Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(vol)}
                    className={`p-1.5 rounded-lg transition ${vol.active ? "text-stone-400 hover:text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                    title={vol.active ? "Deactivate User" : "Activate User"}
                  >
                    {vol.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Create New User / Volunteer"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Madhava Das"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. madhava"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Role & Privilege Level *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none bg-white font-semibold"
              >
                <option value="CALLING_VOLUNTEER">📞 Calling Volunteer (Outreach)</option>
                <option value="RELATIONSHIP_VOLUNTEER">🤝 Relationship Volunteer (Counselor)</option>
                <option value="COORDINATOR">🛠️ Coordinator (Team Lead)</option>
                <option value="SUPER_ADMIN">👑 Super Admin (Full Control)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="madhava@chandkheda.org"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98250 XXXXX"
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Initial Login Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#08415C] text-white rounded-xl text-xs font-semibold hover:bg-[#063349] disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Save & Activate User"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`Reset Password for ${selectedUserForPassword?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-stone-600">
            Set a new login password for <strong>{selectedUserForPassword?.email}</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#08415C] text-white rounded-xl text-xs font-semibold hover:bg-[#063349]"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
