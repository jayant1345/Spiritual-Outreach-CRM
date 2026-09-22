"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddPersonModal from "../people/AddPersonModal";
import CallActionModal from "../calling/CallActionModal";
import SendWhatsAppModal from "../whatsapp/SendWhatsAppModal";
import PersonModal from "../people/PersonModal";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export const CRMContext = React.createContext<{
  openPersonModal: (id: string) => void;
  openCallModal: (person: any) => void;
  openWhatsAppModal: (person: any) => void;
  openAddPersonModal: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}>({
  openPersonModal: () => {},
  openCallModal: () => {},
  openWhatsAppModal: () => {},
  openAddPersonModal: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [selectedPersonForCall, setSelectedPersonForCall] = useState<any>(null);
  const [selectedPersonForWhatsApp, setSelectedPersonForWhatsApp] = useState<any>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#08415C] border-2 border-[#D4AF37] flex items-center justify-center animate-pulse mb-3 shadow-lg">
          <span className="text-[#D4AF37] font-bold text-lg">ॐ</span>
        </div>
        <div className="text-sm font-semibold text-[#08415C]">Connecting to Chandkheda CRM...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CRMContext.Provider
      value={{
        openPersonModal: (id) => setSelectedPersonId(id),
        openCallModal: (person) => setSelectedPersonForCall(person),
        openWhatsAppModal: (person) => setSelectedPersonForWhatsApp(person),
        openAddPersonModal: () => setIsAddPersonOpen(true),
        refreshTrigger,
        triggerRefresh,
      }}
    >
      <div className="min-h-screen bg-[#FAF8F5] flex relative overflow-x-hidden">
        {/* Divine Sri Sri Radha Govind Ahmedabad Devotional Glass Background */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            backgroundImage: "url('/images/radha-govind-watermark.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            backgroundAttachment: "fixed",
            opacity: 0.7,
            filter: "contrast(125%) brightness(65%) saturate(135%)",
          }}
        />


        <Sidebar onOpenAddPerson={() => setIsAddPersonOpen(true)} />

        <div className="flex-1 ml-20 sm:ml-72 flex flex-col min-h-screen relative z-10">
          <Header onOpenAddPerson={() => setIsAddPersonOpen(true)} />
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
        </div>

        <AddPersonModal
          isOpen={isAddPersonOpen}
          onClose={() => setIsAddPersonOpen(false)}
          onPersonAdded={triggerRefresh}
        />

        <CallActionModal
          isOpen={!!selectedPersonForCall}
          onClose={() => setSelectedPersonForCall(null)}
          person={selectedPersonForCall}
          onCallLogged={triggerRefresh}
        />

        <SendWhatsAppModal
          isOpen={!!selectedPersonForWhatsApp}
          onClose={() => setSelectedPersonForWhatsApp(null)}
          person={selectedPersonForWhatsApp}
          onSentSuccess={triggerRefresh}
        />

        <PersonModal
          isOpen={!!selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          personId={selectedPersonId}
          onOpenCallModal={(p) => {
            setSelectedPersonId(null);
            setSelectedPersonForCall(p);
          }}
          onOpenWhatsAppModal={(p) => {
            setSelectedPersonId(null);
            setSelectedPersonForWhatsApp(p);
          }}
        />
      </div>
    </CRMContext.Provider>
  );
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthenticatedAppShell>{children}</AuthenticatedAppShell>
    </AuthProvider>
  );
}
