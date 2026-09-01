# Coreventory — Enterprise Cloud ERP, POS & GST Platform

<div align="center">

![Coreventory Banner](public/favicon.svg)

**A high-speed, multi-tenant Cloud ERP, Counter POS, and GST compliance operating system built for retail, wholesale, and distribution businesses.**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![GST Ready](https://img.shields.io/badge/GST-Compliance-059669)](https://www.gst.gov.in/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [Mock Data](#-1-click-sample-data) • [Documentation](#-documentation)

</div>

---

## 📌 Overview

**Coreventory** is an all-in-one business management platform designed to replace fragmented desktop accounting tools and manual spreadsheets. Built with a modern React 18 single-page architecture backed by Google Cloud Firestore, Coreventory delivers sub-second counter billing, automated Indian GST compliance, multi-godown stock control, and integrated financial ledgers.

---

## 🚀 Key Features

### ⚡ 1. High-Speed Standalone POS Terminal (`/pos`)
- **Continuous Barcode Gun Listener**: Instant continuous scanning without needing to manually focus search inputs.
- **Audio Feedback**: Synthesized audio beep confirmation on every successful scan using the Web Audio API.
- **Keyboard Hotkeys**: Full keyboard-driven cashier workflow (`F2` Search, `F4` Tender, `F7` Hold Bill, `F9` Fast Cash).
- **Split Tender Billing**: Settle payments across multiple payment channels simultaneously (Cash, UPI QR, Card, Cheque).
- **Thermal Receipt Printing**: 1-click thermal receipts optimized for 58mm and 80mm ESC/POS printers.

### 📦 2. Advanced Inventory & Multi-Godown Control
- **Dual-Unit Conversions**: Manage primary and secondary units with dynamic conversion ratios (e.g., `1 Box = 12 Pieces`).
- **Batch & Expiry Management**: FEFO (First-Expiry-First-Out) stock tracking with automated expiry risk alerts.
- **Serial Number / IMEI Tracking**: Track high-value electronic units from purchase to retail delivery.
- **Multi-Godown Stock Transfers**: Transfer inventory between warehouses with delivery challans and audit trails.
- **In-App Barcode Generator**: Print standard Code128 and QR stickers across 12, 24, and 40-up label sheets.

### 🧾 3. Complete Indian GST Compliance Suite
- **Auto Place-of-Supply Engine**: Automatic split between Intra-State (`CGST + SGST`) and Inter-State (`IGST`).
- **GSTR-1 Portal-Ready Exports**: Export verified JSON and CSV files formatted strictly for the official GST Portal (`B2B`, `B2CL`, `B2CS`, `CDNR`, `HSN Summary`).
- **GSTR-3B Consolidated Summary**: Automated monthly tax liability, eligible Input Tax Credit (ITC), and net payable math.
- **E-Way Bill JSON Generation**: 1-click E-Way Bill JSON export for consignments exceeding ₹50,000.
- **E-Invoicing Simulation**: IRN (Invoice Reference Number) generation and encrypted Signed QR code stamping.

### 💳 4. Financial Accounting & Party Ledgers
- **Cash Book & Bank Accounts**: Real-time balance monitoring with multi-bank account management.
- **Contra Fund Transfers**: Record internal transfers between Cash and Bank accounts with zero ledger discrepancies.
- **Expense Tracker with ITC Claims**: Log operational overheads with GST input tax credit categorization.
- **Party Ledgers**: Running Debit/Credit statement of accounts with PDF exports for customers and suppliers.

### 🛍️ 5. Digital Mini-Shop & WhatsApp CRM
- **Public Online Storefront**: Convert offline inventory into an online catalog with direct WhatsApp ordering.
- **Payment Reminders**: 1-click WhatsApp payment reminders with dynamic live UPI QR payment links.

### 👥 6. Multi-Tenant SaaS & RBAC Security
- **Multi-Tenant Isolation**: Strict Firestore data scoping partitioned by `companyId`.
- **Role-Based Access Control**: Granular permissions for `Admin`, `Cashier`, `Accountant`, and `Warehouse Manager`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Core** | React 18, Vite, React Router DOM 6 |
| **Styling & Design System** | Tailwind CSS, Plus Jakarta Sans, Lucide React, Framer Motion |
| **Backend & Cloud DB** | Google Cloud Firestore, Firebase Authentication |
| **Data Visualization** | Recharts |
| **Document Generation** | jsPDF, html2canvas, Native Print CSS (`@page A4`) |
| **Audio Engine** | Web Audio API (real-time scanner beeps) |

---

## 📂 Project Structure

```text
coreventory/
├── src/
│   ├── assets/              # Logos and static media assets
│   ├── components/
│   │   ├── layout/          # Navbar, Sidebar, PageContainer
│   │   └── ui/              # Modal, Badge, StatCard, DataTable
│   ├── context/             # AuthContext, ThemeContext
│   ├── lib/                 # Firebase config, utility helpers
│   ├── pages/
│   │   ├── auth/            # Clean Login & Session Management
│   │   ├── dashboard/       # Real-time KPIs, Revenue & Stock Charts
│   │   ├── inventory/       # Items, Godowns, Barcode Generator, Batches
│   │   ├── pos/             # Fullscreen Retail POS Terminal
│   │   ├── sales/           # Sales Invoices, Challans, Credit Notes
│   │   ├── purchases/       # Purchase Bills, Vendor Management
│   │   ├── quotations/      # Price Estimates & Proposals
│   │   ├── gst/             # GSTR-1, GSTR-3B, E-Way Bill JSON
│   │   ├── accounts/        # Cash Book, Bank Accounts, Contra Transfers
│   │   ├── reports/         # P&L, Stock Summary, Day Book, Tax Ledgers
│   │   └── settings/        # Company Profile, Print Config, Backup/Restore
│   └── utils/
│       ├── taxEngine.js     # State codes, GST validation, Place of Supply
│       ├── invoiceGenerator # PDF generator with thermal & A4 layouts
│       └── mockDataLoader.js# 15-collection demo business seeder
├── FEATURES.md              # Complete ERP feature matrix & architecture
├── USER_MANUAL.md           # End-to-end operator & cashier manual
└── vite.config.js           # Vite build configuration
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### 2. Clone and Install
```bash
# Clone the repository
git clone https://github.com/sherwinbritto7/Coreventory.git
cd Coreventory

# Install project dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🪄 1-Click Sample Data *(Demo Administrator Only)*

Coreventory includes an integrated **1-Click Mock Data Loader** designed for instant evaluation and demo presentations. To protect production operational records from accidental overwrites, this tool is restricted exclusively to the authorized demo account (`kakashigod777@gmail.com`):

1. Log into the platform using `kakashigod777@gmail.com`.
2. Click the **"Fill Mock Data"** button on the top right of the **Dashboard** (or navigate to **Settings > Backup & Restore**).
3. The platform automatically seeds **15 Firestore collections** with realistic Indian wholesale/retail business data:
   - 8 Products (with HSN codes, batches, serials, and low-stock alerts)
   - 4 Customers with GSTINs and party balances
   - 2 Verified Suppliers
   - Sales Invoices, POS Bills, and Delivery Challans
   - Bank Accounts, Cash Book entries, and Contra transfers
   - Expenses with GST Input Tax Credit categorization
   - Promotional discount coupons and web orders

---

## 📖 Documentation

- **[FEATURES.md](file:///c:/Sherwin/projects/coreventory/FEATURES.md)**: Full module specification and competitive feature matrix against industry software.
- **[USER_MANUAL.md](file:///c:/Sherwin/projects/coreventory/USER_MANUAL.md)**: Operations handbook covering counter billing, inventory workflows, and GST filing procedures.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
