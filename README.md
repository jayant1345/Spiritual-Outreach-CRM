# 🪷 ISKCON Chandkheda • Spiritual Outreach & Relationship CRM
> **Sri Sri Radha Govind Seva** — Comprehensive Devotee Care, Calling Sewa, Attendance Matrix & Sadhana Growth System.

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-08415C?logo=next.dot.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)](https://sqlite.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-D4AF37?logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 📖 Overview

The **Spiritual Outreach & Relationship CRM** is a purpose-built, zero-recurring-cost management platform tailored for the **ISKCON Chandkheda Center (Ahmedabad)**. Designed with a sacred devotional aesthetic (Sandalwood Ivory, Morpankh Teal, and Temple Gold with Frosted Glass styling), it empowers temple leadership, calling volunteers, and spiritual counselors to serve seekers and devotees systematically.

---

## ✨ Key Features & Modules

### 1. 📇 Master Person Database & Devotee Lifecycle
- **Unified Profile**: Full spiritual journey tracking from first-time seeker to initiated devotee (*First Contact ➔ Visitor ➔ Sadhaka ➔ Ashraya ➔ Diksha*).
- **Comprehensive Fields**: Chant rounds, spiritual counsellor, locality, profession, family members, native place, and yatra history.
- **Bulk Excel/CSV Import & Export**: One-click bulk ingestion of contact lists and program registrations.

### 2. 📞 Calling Sewa Desk (Zero-Cost Web Dialer)
- **Today's Priority Queue**: Automatic queue generation for follow-ups, birthday/anniversary blessings, and event invites.
- **Instant Click-to-Call**: Opens mobile dialer or default calling client (`tel:` protocol) with zero monthly telephony fees.
- **Structured Outcome Logging**: Record dispositions (*Connected, Busy, Call Back, Interested, Donated, Unreachable*) with automatic follow-up scheduling.

### 3. 🤝 Relationship Calling & Counselor Care
- **Dedicated Counselee Views**: Relationship volunteers only see their allocated counselees for intimate, confidential devotee care.
- **Personalized Notes & Timeline**: Log spiritual milestones, counseling sessions, and prayer requests.

### 4. 🎓 Courses & Attendance Matrix
- **Course & Batch Management**: Manage Bhagavad Gita Shiksha (Batches 1–5), Bhakti Shastri, and Youth programs.
- **Dynamic Attendance Grid**: Session-by-session checkbox matrix with automatic regularity calculation (*Regular ≥75%, Irregular 50–74%, Low <50%*).

### 5. 📿 Sadhana & 16 Rounds Japa Tracker
- **Daily Mala Logger**: Real-time logging of daily rounds chanted (1 to 16+ rounds).
- **Streak & Sadhana Milestones**: Visual tracking of consistency with motivational milestone badges.

### 6. 🚆 Yatra & Festival Manager
- **Upcoming Yatras**:
  - 🌸 **Mayapur & Jagannath Puri Yatra**: April 26, 2026
  - 🦚 **Vrindavan & Braj Dham Yatra**: November 7, 2026
- **Bus/Room Allocation & Payments**: Track advance payments, room sharing, and Prasad requirements.

### 7. 💬 WhatsApp Broadcast Studio (Zero Cost)
- **Pre-formatted Devotional Templates**: One-click WhatsApp broadcast templates for Sunday Feast, Festival Invites, and Sadhana check-ins.
- **Direct WhatsApp API**: Uses `https://wa.me/` direct deep links — requires zero Meta API approval or subscription costs.

### 8. 🛡️ Role-Based Access Control (RBAC)
| Role | User Profile | Permissions |
| :--- | :--- | :--- |
| **Super Admin** | Akshay Aanand Prabhu | Full system configuration, user creation, data deletion, financial reports |
| **Coordinator** | HG Radheshyam Das | Team allocation, course setup, full DB read/write |
| **Calling Volunteer** | Amit Patel | Assigned calling queue only, log dispositions, schedule follow-ups |
| **Relationship Volunteer** | Priya Sharma | Assigned spiritual counselees only, sadhana & attendance tracking |

---

## 🎨 Devotional Design System

- **Sandalwood Ivory (`#FAF8F5`)**: Calming temple ambiance backdrop.
- **Morpankh Teal (`#08415C`)**: Royal Peacock Feather accent representing Sri Krishna.
- **Temple Gold (`#D4AF37`)**: Sacred Gilded highlight for active states and badges.
- **Frosted Glass (Glassmorphism)**: `backdrop-filter: blur(14px)` with high-contrast divine darshan background.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Database**: SQLite via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Salted & hashed PBKDF2-SHA512 with HTTP-only cookie sessions
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA**: Mobile-installable Progressive Web App with standalone viewport

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm** or **pnpm**

### 2. Clone the Repository
```bash
git clone https://github.com/jayant1345/Spiritual-Outreach-CRM.git
cd Spiritual-Outreach-CRM
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database & Seed Data
```bash
# Push Prisma Schema to SQLite
npx prisma db push

# Seed default admin, volunteers, demo seekers, and courses
node prisma/seed.js
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or configured port) in your browser.

---

## 🔐 Default Demo Accounts

You can log in immediately using these pre-seeded accounts:

| Role | Username / Identifier | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin` *(Akshay Aanand Prabhu)* | `admin123` |
| **Coordinator** | `coordinator` | `coord123` |
| **Calling Volunteer** | `amit` | `caller123` |
| **Relationship Counselor** | `priya` | `rel123` |

*(You can also use the One-Click Quick Login buttons on the sign-in page for instant testing.)*

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma         # Database schema & relationships
│   └── seed.js               # Initial seeding script
├── public/
│   ├── icons/                # Official ISKCON Ahmedabad logos & PWA icons
│   ├── images/               # Sri Sri Radha Govind Ahmedabad backgrounds
│   └── manifest.json         # Progressive Web App manifest
├── src/
│   ├── app/
│   │   ├── api/              # Next.js Serverless Route Handlers (Auth, Calls, People, etc.)
│   │   ├── attendance/       # Course Attendance Matrix
│   │   ├── calling-sewa/     # Calling Desk Queue & Dialing
│   │   ├── courses/          # Batch Management & Rosters
│   │   ├── followups/        # Follow-up Calendars & Alarms
│   │   ├── japa/             # 16-Rounds Sadhana Logger
│   │   ├── login/            # Devotional Authentication Portal
│   │   ├── people/           # Master Devotee Directory
│   │   ├── programs/         # Sunday Feast & Seminar RSVs
│   │   ├── relationship-calling/ # Counselor Devotee Care
│   │   ├── reports/          # Executive Outreach Analytics
│   │   ├── settings/         # Center Configuration
│   │   ├── spiritual-journey/# Stage Funnel Progression
│   │   ├── todays-work/      # Volunteer Daily Action Center
│   │   ├── volunteers/       # User & Access Management
│   │   ├── whatsapp/         # WhatsApp Broadcast Studio
│   │   └── yatra/            # Dham Yatra Registration & Logistics
│   ├── components/           # Reusable UI components & Modals
│   ├── contexts/             # Client-side Auth & Global State
│   └── lib/                  # Helper utilities, Prisma client & WhatsApp generators
└── README.md
```

---

## 📜 Devotional Dedication

> *“By serving the devotees of the Lord, one becomes very dear to Sri Krishna.”*  
> Dedicated at the lotus feet of **His Divine Grace A.C. Bhaktivedanta Swami Prabhupada** and **Sri Sri Radha Govind Bhagavan (ISKCON Ahmedabad / Chandkheda Center)**.
