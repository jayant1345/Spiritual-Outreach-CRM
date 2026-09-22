"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Lock, User, Shield, PhoneCall, HeartHandshake, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, switchDemoUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
      setLoading(false);
    }
  };

  const handleDemoClick = async (role: string) => {
    setLoading(true);
    setError(null);
    await switchDemoUser(role);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Sacred Sri Sri Radha Govind Ahmedabad Glass Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/radha-govind-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 15%",
          opacity: 0.8,
          filter: "contrast(122%) brightness(72%) saturate(125%)",
        }}
      />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#08415C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5D8B8] p-1.5 shadow-xl flex items-center justify-center">
            <img
              src="/icons/iskcon-ahmedabad-logo.svg"
              alt="ISKCON Ahmedabad"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-xl flex items-center justify-center bg-[#08415C]">
            <img
              src="/icons/radha-madhav.jpg"
              alt="Sri Sri Radha Govind"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold font-serif text-[#08415C] tracking-tight">
          Sri Sri Radha Govind Seva
        </h1>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-widest text-[#B8860B]">
          ISKCON Chandkheda Center • Devotee Care CRM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-[#08415C]/15 rounded-2xl border border-white/60 sm:px-10">
          <div className="mb-6 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-900">Sign in to your Sewa Account</h2>
            <p className="text-xs text-stone-500 mt-0.5">Enter your allocated credentials to view your assigned work.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <span className="font-bold text-rose-600">⚠️</span>
              <p className="flex-1 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Username / Email / Mobile
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. coordinator or admin@chandkheda.org"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] focus:border-[#08415C] outline-none transition-all placeholder:text-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-[#08415C] focus:border-[#08415C] outline-none transition-all placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-[#08415C] focus:ring-[#08415C] border-stone-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-stone-600">
                  Stay signed in
                </label>
              </div>

              <div className="text-xs">
                <a href="#demo" onClick={() => setError("Please contact Temple Admin to reset your password.")} className="font-medium text-[#08415C] hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#08415C] hover:bg-[#063349] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08415C] disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter CRM Sewa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 text-center mb-3">
              ✨ Quick Role Login (One-Click Evaluation)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoClick("SUPER_ADMIN")}
                className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 hover:bg-[#08415C]/10 border border-stone-200 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-md bg-[#08415C] text-white flex items-center justify-center text-xs">
                  <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">Admin</div>
                  <div className="text-[10px] text-stone-500">Full Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("COORDINATOR")}
                className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 border border-stone-200 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">Coordinator</div>
                  <div className="text-[10px] text-stone-500">Team Leader</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("CALLING_VOLUNTEER")}
                className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 hover:bg-blue-50 border border-stone-200 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">Caller (Amit)</div>
                  <div className="text-[10px] text-stone-500">Calling Desk Only</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoClick("RELATIONSHIP_VOLUNTEER")}
                className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-200 text-left transition-all"
              >
                <div className="w-7 h-7 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs">
                  <HeartHandshake className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">Counselor (Priya)</div>
                  <div className="text-[10px] text-stone-500">Counselees Only</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-500 italic">
          "Serving the seekers of truth is our highest worship."
        </p>
      </div>
    </div>
  );
}
