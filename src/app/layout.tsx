import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootShell from "@/components/layout/RootShell";

export const metadata: Metadata = {
  title: "Spiritual Outreach CRM | Sri Sri Radha Govind Chandkheda",
  description: "Devotee Relationship, Calling Sewa, Course Attendance Matrix & WhatsApp Broadcast System for Chandkheda Center",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/radha-madhav.jpg",
    apple: "/icons/radha-madhav.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chandkheda CRM",
  },
};

export const viewport: Viewport = {
  themeColor: "#08415C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#08415C" />
      </head>
      <body className="antialiased selection:bg-[#D4AF37]/30 selection:text-[#08415C]">
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
