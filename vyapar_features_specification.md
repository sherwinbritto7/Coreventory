# Vyapar App — Comprehensive Feature Specification & System Breakdown

A detailed feature-by-feature reference and architecture blueprint modeled after **Vyapar**, tailored for developers building an end-to-end Billing, Inventory, Accounting, and GST Management platform.

---

## 1. Core Architecture & High-Level Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             VYAPAR-STYLE ERP ENGINE                         │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 1. Billing & Sales│ 2. Inventory &    │ 3. Accounting &   │ 4. GST & Tax    │
│    - POS Billing  │    Stock Control  │    Party Ledgers  │    Compliance   │
│    - Tax Invoices │    - Batches & Exp│    - Customers    │    - GSTR-1/3B  │
│    - Challans/PO  │    - Barcodes/POS │    - Suppliers    │    - E-Way Bill │
│    - Estimates    │    - Godowns      │    - Bank/Cash    │    - E-Invoicing│
├───────────────────┴───────────────────┴───────────────────┴─────────────────┤
│ 5. Reports & Analytics (P&L, Balance Sheet, Stock Ageing, Receivables/Payables)│
│ 6. Digital Ecosystem (Online Store / Mini Web Shop, WhatsApp Reminders, POS) │
│ 7. System & Utilities (Multi-Device Sync, Offline Mode, Role-Based Access)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invoicing, Billing & Sales Management

### 2.1 Document Creation Workflows
- **Tax Invoices (GST & Non-GST):** Custom prefix sequences (e.g., `INV-2026-001`), line-item discounts (percentage/flat), shipping charges, packaging fees, round-off calculation.
- **Quotations / Estimates / Proforma Invoices:** Draft pricing proposals that can be converted into active Invoices with a single click.
- **Delivery Challans & Packing Slips:** Record dispatch without generating immediate financial journal entries; converts to invoice upon confirmed delivery.
- **Sales Return / Credit Notes:** Manage product returns, restock items automatically, issue credit balance or cash refunds against existing invoices.
- **Purchase Return / Debit Notes:** Reverse inventory purchases and adjust vendor ledger balances.

### 2.2 Point of Sale (POS) Fast Billing
- High-speed checkout mode optimized for keyboard-only or touchscreen workflows.
- Instant item lookup via barcode scanner, SKU code, or quick-pick shortcut buttons.
- Multi-payment tender splitting (e.g., ₹500 Cash + ₹1,500 UPI on the same bill).
- Hold/Retrieve cart capability for busy counter queues.

### 2.3 Invoice Customization & Dispatch
- Multiple print templates (Classic, Modern, Thermal 2-inch/3-inch, A4, A5 Landscape/Portrait).
- Custom logo, signature upload, dynamic UPI QR code generator for direct payment scanning on the invoice.
- Direct dispatch channels: WhatsApp Web/API, SMS gateway, and automated Email delivery with PDF attachment.

---

## 3. Inventory & Warehouse Management

### 3.1 Item Master & Categorization
- Multi-level categorization (Categories, Subcategories, Brands).
- Dual Unit Conversion support (e.g., Base: `Piece`, Secondary: `Box` where `1 Box = 12 Pieces`).
- Custom Item Attributes (Size, Color, Serial Numbers, IMEI Numbers).
- Tax mapping: HSN/SAC codes with pre-configured GST rates (0%, 5%, 12%, 18%, 28%, Cess).

### 3.2 Advanced Stock Control
- **Batch & Expiry Date Management:** First-Expiry-First-Out (FEFO) / FIFO picking rules; automated alerts for near-expiry stock.
- **Serial Number / IMEI Tracking:** Track high-value electronic goods by distinct serial numbers from purchase to sale.
- **Low Stock & Reorder Points:** Configurable threshold alerts triggered on dashboard and notification bell.
- **Stock Adjustments & Waste Logging:** Record manual adjustments for theft, leakage, physical audit variances, or expired goods.

### 3.3 Multi-Godown / Warehouse Operations
- Setup multiple storage locations/branches.
- Inter-warehouse stock transfer vouchers with in-transit tracking.
- Godown-wise stock valuation and inventory aging reports.

### 3.4 Barcode Generation & Printing
- Integrated barcode label designer (supports Code128, QR, EAN-13).
- Bulk label printing for new stock receipts.

---

## 4. Accounting, Ledgers & Banking

### 4.1 Party Management (Customers & Vendors)
- Unified Party directory with distinct roles (`Customer`, `Supplier`, `Both`).
- Party categorization (Retail, Wholesaler, Distributor).
- GSTIN verification / auto-fetch business details from tax registries.
- Credit Limit enforcement (block billing if outstanding balance exceeds limit).
- Credit Period & Due Date tracking with automated overdue penalty calculation.

### 4.2 Accounts & Financial Ledgers
- **Cash Book & Multi-Bank Accounts:** Track petty cash registers, current accounts, savings accounts, and digital wallets.
- **Bank Reconciliation:** Match bank transaction feeds against software records.
- **Expense Tracker:** Log indirect and direct overhead expenses (Rent, Electricity, Logistics, Staff Salaries) with GST input credit eligibility.
- **Payment In / Payment Out Vouchers:** Record customer settlements, vendor payouts, advance deposits, and adjust against multiple pending bills.

---

## 5. GST Compliance, E-Invoicing & E-Way Bills

### 5.1 Tax Engine Logic
- Auto-detection of Intra-State (`CGST` + `SGST`) vs. Inter-State (`IGST`) based on Place of Supply and Business Registration state.
- Reverse Charge Mechanism (RCM) support.
- Composition Scheme vs. Regular Scheme compliance toggles.

### 5.2 Regulatory Document Generation
- **E-Way Bill Generation:** Direct JSON export or API integration to produce E-Way Bills for goods movement > ₹50,000.
- **E-Invoicing (IRN & QR Code):** Integration with Invoice Registration Portals (IRP) to fetch Signed QR and Invoice Reference Number (IRN) directly on invoices.

### 5.3 GST Filing Exports
- **GSTR-1:** Ready-to-upload JSON/Excel breakdown (B2B, B2C Large, B2C Small, CDNR, HSN Summary).
- **GSTR-2 / 2B Reconciliation:** Supplier invoice cross-referencing.
- **GSTR-3B Summary:** Monthly consolidated tax liability and eligible Input Tax Credit (ITC) snapshot.

---

## 6. Business Reports & Intelligence

| Category | Available Reports |
|---|---|
| **Financial Health** | Profit & Loss Statement, Balance Sheet, Trial Balance, Cash Flow Statement |
| **Sales & Purchases** | Sales Summary by Item/Customer/Salesperson, Purchase Summary, Bill-wise Profit Margin |
| **Inventory** | Stock Summary, Low Stock Report, Item Stock Ageing, Batch-wise Expiry Report |
| **Party & Receivables** | Accounts Receivable Aging (30/60/90 days), Party Ledger Statement, Overdue Payment Tracking |
| **Tax & Audit** | GSTR-1, GSTR-3B, HSN-wise Sales Tax Summary, Discount & Expense Reports |

---

## 7. Digital Storefront & Growth Tools

- **Digital Product Catalog / Mini E-Commerce:** Convert offline inventory into a web catalogue with unique URLs where customers can browse and place orders.
- **Order Management:** Accept web/WhatsApp orders, convert to sales invoices, and assign delivery statuses (Pending, Packed, Shipped, Delivered).
- **Automated Payment Reminders:** Scheduled WhatsApp and SMS alerts with payment links/UPI handles for overdue bills.
- **Loyalty & Promotional Schemes:** Item-wise discount rules, buy-one-get-one (BOGO) logic, and customer reward points.

---

## 8. System, Security & Infrastructure Capabilities

- **Offline-First Architecture:** Local SQLite/IndexedDB storage allowing uninterrupted billing during network blackouts.
- **Multi-Device Cloud Synchronization:** Event-driven conflict resolution syncing data seamlessly across Desktop, Mobile (Android/iOS), and Web.
- **Role-Based Access Control (RBAC):** Granular permissions for Admins, Cashiers, Accountants, and Warehouse Managers.
- **Automated Backup & Restore:** Encrypted local backups (ZIP/SQL) and automated Google Drive / Cloud storage sync.
- **Thermal & Hardware Integrations:** Direct ESC/POS printing support, electronic cash drawers, barcode guns, and digital weighing scales.

---

## 9. Suggested Database Entity-Relationship (ER) Overview

```
 [Parties] ──< [Invoices] ──< [InvoiceItems] >── [Items]
     │              │                               │
     │              ├──< [Payments]                 ├──< [Batches]
     │              │                               ├──< [GodownStock]
     └──< [Ledgers] └──< [EWayBills]                └──< [Units]
```

*This markdown file provides the functional baseline to implement, organize sprints, and architect a robust Vyapar-like inventory, accounting, and billing system.*
