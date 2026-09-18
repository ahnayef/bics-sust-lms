# SUST Pathagar

A modern, mobile-first Library Management System tailored for SUST, built with **Next.js**, **Supabase**, and styled with **Tailwind CSS**. Designed for an aggressively responsive, "native app-like" experience across all devices.

## 🌟 Key Features

### 📱 Aggressively Responsive UI

- **Mobile-First Design**: The entire dashboard (User, Moderator, and Admin views) is built to feel like a native mobile app.
- **Stacked Card Layouts**: Horizontal scrolling is eliminated in favor of clean, touch-friendly stacked cards on mobile devices.
- **Intuitive Navigation**: Easy-to-reach tabs and menus that dynamically adapt to the user's viewport.

### 🌐 Bilingual Support

- **Full EN/BN Localization**: Seamlessly switch between English and Bengali across the entire platform.
- **Dynamic Content**: Live search counters and system messages adapt to the selected language.

### 👥 Role-Based Access Control

- **Members**: Can view the book list, check availability, read PDFs, and view their own borrowing history.
- **Moderators**: Can manage transactions (borrow/return), manage book copies, generate QR codes, and view member data.
- **Admins**: Full system access including advanced data exports and overriding permissions.

### 📚 Comprehensive Library Management

- **Book & Copy Tracking**: Manage books and their individual physical copies with distinct IDs.
- **Live Search & Filtering**: Fast, real-time search with live result counters and active filter indicators on books and copies pages.
- **Transaction Workflows**: Streamlined workflows for tracking book borrowing, returning, and managing active checkouts.

### 🖨️ Tools & Utilities

- **QR Code Generation & Scanning**: Quickly print and scan QR codes for physical book copies to speed up checkouts and returns.
- **Data Export Center**: Moderators and Admins can export Books, Copies, Users, Transactions, and Categories.
  - **CSV**: UTF-8 BOM encoding ensures perfect compatibility with Microsoft Excel, especially for Bengali characters.
  - **PDF**: Styled, letterhead-printable PDF formats for official record keeping.
- **PDF Viewer**: Built-in mechanisms to read digital book copies directly within the platform.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Row Level Security)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Runtime / Package Manager**: [Bun](https://bun.sh/)

## 🚀 Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh/) installed.

### Installation

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Environment Setup**:
   Create a `.env.local` file in the root directory with your required database credentials. The app natively uses Node's `process.loadEnvFile` for Drizzle configs.

3. **Run the development server**:
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Other Commands

```bash
bun run build      # Build the application for production
bun run start      # Start the production server
bun run lint       # Run ESLint to catch issues
```
