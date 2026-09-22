"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: "SUPER_ADMIN" | "COORDINATOR" | "CALLING_VOLUNTEER" | "RELATIONSHIP_VOLUNTEER";
  avatar?: string | null;
  privileges?: string[] | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoUser: (role: string) => Promise<void>;
  isCoordinator: boolean;
  isAdmin: boolean;
  isCallingVolunteer: boolean;
  isRelationshipVolunteer: boolean;
  canAccess: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (identifier: string, password: string) => {
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
      router.push("/");
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Login connection failed" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  const switchDemoUser = async (role: string) => {
    let identifier = "admin@chandkheda.org";
    let password = "Admin@123";

    if (role === "COORDINATOR") {
      identifier = "coordinator@chandkheda.org";
      password = "Coord@123";
    } else if (role === "CALLING_VOLUNTEER") {
      identifier = "amit.sewa@chandkheda.org";
      password = "Amit@123";
    } else if (role === "RELATIONSHIP_VOLUNTEER") {
      identifier = "priya.sewa@chandkheda.org";
      password = "Priya@123";
    }

    await login(identifier, password);
  };

  const isAdmin = user?.role === "SUPER_ADMIN";
  const isCoordinator = user?.role === "COORDINATOR" || isAdmin;
  const isCallingVolunteer = user?.role === "CALLING_VOLUNTEER";
  const isRelationshipVolunteer = user?.role === "RELATIONSHIP_VOLUNTEER";

  const canAccess = (path: string): boolean => {
    if (!user) return path === "/login";
    if (isAdmin || user.role === "COORDINATOR") return true;

    if (user.role === "CALLING_VOLUNTEER") {
      const allowedPaths = ["/", "/todays-work", "/calling-sewa", "/followups", "/whatsapp"];
      return allowedPaths.some((p) => path === p || path.startsWith(p + "/"));
    }

    if (user.role === "RELATIONSHIP_VOLUNTEER") {
      const allowedPaths = ["/", "/todays-work", "/relationship-calling", "/courses", "/japa", "/spiritual-journey", "/followups", "/whatsapp"];
      return allowedPaths.some((p) => path === p || path.startsWith(p + "/"));
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchDemoUser,
        isAdmin,
        isCoordinator,
        isCallingVolunteer,
        isRelationshipVolunteer,
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
