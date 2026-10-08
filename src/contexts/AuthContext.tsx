"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PermissionKey, hasPermission as checkPermission } from "@/lib/permissions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "COORDINATOR" | "CALLING_VOLUNTEER" | "RELATIONSHIP_VOLUNTEER";
  avatar?: string | null;
  privileges?: string[] | null;
  permissions?: PermissionKey[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isCoordinator: boolean;
  isCallingVolunteer: boolean;
  isRelationshipVolunteer: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PWA_TOKEN_STORAGE_KEY = "chandkheda_pwa_auth_token";
const PWA_USER_STORAGE_KEY = "chandkheda_pwa_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);

      // Check for saved PWA/browser auth token in localStorage
      let storedToken: string | null = null;
      if (typeof window !== "undefined") {
        storedToken = localStorage.getItem(PWA_TOKEN_STORAGE_KEY);
      }

      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const res = await fetch("/api/auth/me", {
        headers,
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem(PWA_USER_STORAGE_KEY, JSON.stringify(data.user));
          }
        } else {
          setUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(PWA_TOKEN_STORAGE_KEY);
            localStorage.removeItem(PWA_USER_STORAGE_KEY);
          }
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(PWA_TOKEN_STORAGE_KEY);
          localStorage.removeItem(PWA_USER_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (identifier: string, password: string, rememberMe = true) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Authentication failed" };
      }

      setUser(data.user);

      // Save token and credentials securely for automatic PWA & persistent browser login
      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem(PWA_TOKEN_STORAGE_KEY, data.token);
        localStorage.setItem(PWA_USER_STORAGE_KEY, JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem("chandkheda_saved_identifier", identifier.trim());
        }
      }

      router.push("/");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Login connection failed" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(PWA_TOKEN_STORAGE_KEY);
        localStorage.removeItem(PWA_USER_STORAGE_KEY);
      }
      setUser(null);
      router.push("/login");
    }
  };

  const isAdmin = user?.role === "SUPER_ADMIN";
  const isCoordinator = user?.role === "COORDINATOR" || isAdmin;
  const isCallingVolunteer = user?.role === "CALLING_VOLUNTEER";
  const isRelationshipVolunteer = user?.role === "RELATIONSHIP_VOLUNTEER";

  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      return checkPermission(user, permission);
    },
    [user]
  );

  const canAccess = useCallback(
    (path: string): boolean => {
      if (!user) return path === "/login";
      if (isAdmin) return true;

      // Restrict volunteers from admin areas unless granted permission
      if (path === "/volunteers" || path.startsWith("/volunteers/")) {
        return hasPermission("users:manage");
      }
      if (path === "/settings" || path.startsWith("/settings/")) {
        return hasPermission("settings:manage");
      }
      if (path === "/reports" || path.startsWith("/reports/")) {
        return hasPermission("reports:view");
      }

      if (user.role === "CALLING_VOLUNTEER") {
        const allowedPaths = ["/", "/todays-work", "/calling-sewa", "/followups", "/whatsapp"];
        return allowedPaths.some((p) => path === p || path.startsWith(p + "/"));
      }

      if (user.role === "RELATIONSHIP_VOLUNTEER") {
        const allowedPaths = [
          "/",
          "/todays-work",
          "/relationship-calling",
          "/courses",
          "/attendance",
          "/japa",
          "/spiritual-journey",
          "/followups",
          "/whatsapp",
        ];
        return allowedPaths.some((p) => path === p || path.startsWith(p + "/"));
      }

      return true;
    },
    [user, isAdmin, hasPermission]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isCoordinator,
        isCallingVolunteer,
        isRelationshipVolunteer,
        hasPermission,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
