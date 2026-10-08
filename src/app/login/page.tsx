"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Preload remembered username/email on this browser or PWA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("chandkheda_saved_identifier");
      if (savedId) {
        setIdentifier(savedId);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your username, email, or mobile number");
      return;
    }
    if (!password) {
      setError("Please enter your password. Authentication requires a password.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(identifier, password, rememberMe);
    if (!result.success) {
      setError(result.error || "Invalid credentials. Please verify your password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Sacred Sri Sri Radha Govind Ahmedabad Glass Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/images/radha-govind-login.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
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
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-[#08415C]/15 rounded-2xl border border-white/60 sm:px-10">
          <div className="mb-6 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-900">Sign in to your Sewa Account</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your assigned username/email and password to authenticate.
            </p>
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#08415C] focus:ring-[#08415C] border-stone-300 rounded cursor-pointer"
                />
                <span className="ml-2 text-xs text-stone-600 font-medium">
                  Stay signed in (Auto-login on PWA)
                </span>
              </label>

              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => setError("Please contact your Temple Admin or Coordinator to reset your password.")}
                  className="font-medium text-[#08415C] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#08415C] hover:bg-[#063349] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08415C] disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In With Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security & PWA Persistence Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 space-y-2">
            <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Secure Authentication:</strong> Password entry is mandatory. Unauthorized access without authenticated credentials is strictly prevented.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
              <Smartphone className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>PWA Mobile App:</strong> When you download or install the CRM as an app, log in with your credentials once. Your session is saved securely and will auto-login on every launch.
              </span>
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
