<style>
  @page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 15mm;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.65;
    font-size: 11pt;
  }

  .pdf-cover {
    page-break-after: always;
    break-after: page;
    padding: 40px 0 20px 0;
    border-bottom: 2px solid #e2e8f0;
  }

  .pdf-title {
    font-size: 26pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 10px;
  }

  .pdf-subtitle {
    font-size: 13pt;
    color: #475569;
    margin-bottom: 24px;
  }

  .pdf-meta-table {
    width: 100%;
    margin-top: 30px;
    border-collapse: collapse;
  }

  .pdf-meta-table td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    font-size: 9.5pt;
  }

  h1 {
    color: #0f172a;
    font-size: 17pt;
    font-weight: 700;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 22pt;
    margin-bottom: 10pt;
    break-before: page;
    page-break-before: always;
  }

  .no-break-before {
    break-before: auto !important;
    page-break-before: auto !important;
  }

  h2 {
    color: #1e293b;
    font-size: 13pt;
    font-weight: 600;
    margin-top: 16pt;
    margin-bottom: 6pt;
    break-after: avoid;
    page-break-after: avoid;
  }

  h3 {
    color: #334155;
    font-size: 11pt;
    font-weight: 600;
    margin-top: 12pt;
    margin-bottom: 4pt;
    break-after: avoid;
    page-break-after: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 9pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
  }

  td {
    padding: 6px 9px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  blockquote {
    margin: 10pt 0;
    padding: 8px 14px;
    background-color: #f8fafc;
    border-left: 4px solid #0284c7;
    color: #334155;
    font-size: 9.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8.5pt;
    background-color: #f1f5f9;
    padding: 1.5px 4px;
    border-radius: 4px;
    color: #0f172a;
  }

  pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 9px 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.4;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  ul, ol {
    margin-top: 3pt;
    margin-bottom: 8pt;
    padding-left: 18px;
  }

  li {
    margin-bottom: 2.5pt;
  }
</style>

<div class="pdf-cover">
  <div class="pdf-title">Coreventory ERP</div>
  <div class="pdf-subtitle">Enterprise Inventory, Billing, Accounting & GST Platform — Comprehensive Feature Specification</div>
  <p>An end-to-end technical and operational reference of all features, modules, workflows, and integrations built into the Coreventory Multi-Tenant SaaS platform.</p>

  <table class="pdf-meta-table">
    <tr>
      <td><strong>Platform Version:</strong> 2.4.0 (Enterprise)</td>
      <td><strong>Document Type:</strong> Technical Features Specification</td>
    </tr>
    <tr>
      <td><strong>Architecture:</strong> Multi-Tenant Cloud ERP</td>
      <td><strong>Technology Stack:</strong> React 18, Vite, Tailwind CSS, Firestore</td>
    </tr>
    <tr>
      <td><strong>Target Industry:</strong> Retail, Wholesale, Distribution, Manufacturing</td>
      <td><strong>Compliance:</strong> GST (GSTR-1, GSTR-3B, E-Way Bill, E-Invoicing)</td>
    </tr>
    <tr>
      <td><strong>Document Status:</strong> Complete / PDF-Ready</td>
      <td><strong>Last Updated:</strong> August 2026</td>
    </tr>
  </table>
</div>

<h1 class="no-break-before">1. Executive Overview & System Architecture</h1>

**Coreventory** is an enterprise-grade billing, inventory, and accounting platform modeled after Indian GST and retail/wholesale operational standards. It provides business owners, counter cashiers, accountants, and warehouse supervisors with real-time operational control.

### Architecture Highlights
- **Front-End Layer:** React 18 with Vite for sub-second hot reload and modular chunk compilation.
- **Design System:** Tailored Vanilla/Tailwind CSS with tabular number figures (	num), clean borders, and dark/light mode parity.
- **Database & State:** Google Cloud Firestore NoSQL document store with multi-tenant logical partitioning by companyId.
- **Audio Synthesis:** Web Audio API 800Hz sine-wave synthesis for instant POS scan feedback without external asset dependencies.
- **Printing Engine:** Native CSS print media query formatting for 80mm thermal rolls, 58mm thermal rolls, and desktop A4/A5 invoices.

---

<h1>2. Comprehensive Feature Matrix</h1>

<table>
  <thead>
    <tr>
      <th>Module</th>
      <th>Route</th>
      <th>Status</th>
      <th>Key Operational Capabilities</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>POS Fast Billing</strong></td>
      <td><code>/pos</code></td>
      <td>Production Ready</td>
      <td>Fullscreen kiosk terminal, hotkeys (F2, F4, F7, F9), continuous barcode scanning, split tender, thermal receipts</td>
    </tr>
    <tr>
      <td><strong>Tax Invoices</strong></td>
      <td><code>/sales</code>, <code>/sales/new</code></td>
      <td>Production Ready</td>
      <td>GST/Non-GST tax invoices, auto CGST/SGST/IGST detection, line discounts, dynamic UPI QR codes</td>
    </tr>
    <tr>
      <td><strong>Quotations / Estimates</strong></td>
      <td><code>/quotations</code></td>
      <td>Production Ready</td>
      <td>Formal price proposals with 1-click Convert to Invoice conversion pipeline</td>
    </tr>
    <tr>
      <td><strong>Delivery Challans</strong></td>
      <td><code>/challans</code></td>
      <td>Production Ready</td>
      <td>Goods dispatch transport packing slips tracking vehicle/driver logs; converts to invoice</td>
    </tr>
    <tr>
      <td><strong>Credit & Debit Notes</strong></td>
      <td><code>/returns</code></td>
      <td>Production Ready</td>
      <td>Sales Returns & Purchase Returns with automated inventory restocking and ledger balancing</td>
    </tr>
    <tr>
      <td><strong>Product Catalog Master</strong></td>
      <td><code>/inventory</code></td>
      <td>Production Ready</td>
      <td>Dual unit conversion (e.g., 1 Box = 12 pcs), HSN/SAC mapping, tax slabs, low stock alerts</td>
    </tr>
    <tr>
      <td><strong>Batch & Expiry (FEFO)</strong></td>
      <td><code>/inventory</code></td>
      <td>Production Ready</td>
      <td>Batch numbers, mfg & expiry dates, near-expiry visual warnings, FEFO picking order</td>
    </tr>
    <tr>
      <td><strong>Serial Number / IMEI</strong></td>
      <td><code>/inventory</code></td>
      <td>Production Ready</td>
      <td>Unique individual serial and IMEI tracking for electronics and consumer appliances</td>
    </tr>
    <tr>
      <td><strong>Stock Adjustments</strong></td>
      <td><code>/inventory/adjustments</code></td>
      <td>Production Ready</td>
      <td>Manual adjustment audit logs for damage, breakage, expired stock, theft, and audit variance</td>
    </tr>
    <tr>
      <td><strong>Multi-Godowns</strong></td>
      <td><code>/inventory/godowns</code></td>
      <td>Production Ready</td>
      <td>Branch warehouse locations and Inter-Godown Stock Transfer Vouchers</td>
    </tr>
    <tr>
      <td><strong>Barcode & QR Designer</strong></td>
      <td><code>/inventory/barcodes</code></td>
      <td>Production Ready</td>
      <td>Code128 and QR label designer with 12-up, 24-up, and 40-up printable sheet layouts</td>
    </tr>
    <tr>
      <td><strong>Purchases & Inward</strong></td>
      <td><code>/purchases</code></td>
      <td>Production Ready</td>
      <td>Vendor purchase bills, input tax credits, and automated stock replenishment</td>
    </tr>
    <tr>
      <td><strong>Cash Book & Banking</strong></td>
      <td><code>/banking</code></td>
      <td>Production Ready</td>
      <td>Petty cash register, multi-bank accounts, digital wallets, and Contra fund transfers</td>
    </tr>
    <tr>
      <td><strong>Expense Tracker</strong></td>
      <td><code>/expenses</code></td>
      <td>Production Ready</td>
      <td>Overhead operating expenses with GST Input Tax Credit (ITC) eligibility tracking</td>
    </tr>
    <tr>
      <td><strong>Payment Vouchers</strong></td>
      <td><code>/payments</code></td>
      <td>Production Ready</td>
      <td>Payment In (Customer receipts) & Payment Out (Vendor payouts) with multi-bill settlement</td>
    </tr>
    <tr>
      <td><strong>Party Ledgers (CRM)</strong></td>
      <td><code>/customers</code>, <code>/suppliers</code></td>
      <td>Production Ready</td>
      <td>Credit limits, payment credit terms (e.g., 30 days), interactive Statement of Accounts</td>
    </tr>
    <tr>
      <td><strong>GSTR-1 Reports & JSON</strong></td>
      <td><code>/gst-reports</code></td>
      <td>Production Ready</td>
      <td>Tables 4A, 7, 9B, 12 with direct NIC-compliant JSON and CSV portal uploads</td>
    </tr>
    <tr>
      <td><strong>GSTR-3B Summary</strong></td>
      <td><code>/gst-reports</code></td>
      <td>Production Ready</td>
      <td>Monthly consolidated Outward Tax Liability vs. Inward ITC and Net Cash Payable</td>
    </tr>
    <tr>
      <td><strong>NIC E-Way Bill JSON</strong></td>
      <td><code>/gst-reports</code></td>
      <td>Production Ready</td>
      <td>JSON generation for consignments exceeding ₹50,000 with Transporter ID and vehicle logs</td>
    </tr>
    <tr>
      <td><strong>E-Invoicing (IRN & QR)</strong></td>
      <td><code>/gst-reports</code></td>
      <td>Production Ready</td>
      <td>64-character hash generation and B2B Signed QR code simulation</td>
    </tr>
    <tr>
      <td><strong>Profit & Loss (P&L)</strong></td>
      <td><code>/reports</code></td>
      <td>Production Ready</td>
      <td>Gross Sales Revenue, Cost of Goods Sold (COGS), Operating Overheads, and Net Profit</td>
    </tr>
    <tr>
      <td><strong>Balance Sheet</strong></td>
      <td><code>/reports</code></td>
      <td>Production Ready</td>
      <td>Liquid Assets, Inventory Asset Value, Receivables, Payables, and Owner Capital Equity</td>
    </tr>
    <tr>
      <td><strong>Bill-wise Margins</strong></td>
      <td><code>/reports</code></td>
      <td>Production Ready</td>
      <td>Invoice-by-invoice margin percentage and profitability analysis</td>
    </tr>
    <tr>
      <td><strong>Ageing Analysis</strong></td>
      <td><code>/reports</code></td>
      <td>Production Ready</td>
      <td>Receivables and Payables aging buckets (0-30, 31-60, 61-90, 90+ days overdue)</td>
    </tr>
    <tr>
      <td><strong>Public Mini Web Shop</strong></td>
      <td><code>/store/:companyId</code></td>
      <td>Production Ready</td>
      <td>Customer-facing digital web catalogue with categories, cart, and "Order via WhatsApp"</td>
    </tr>
    <tr>
      <td><strong>Online Orders Pipeline</strong></td>
      <td><code>/orders</code></td>
      <td>Production Ready</td>
      <td>Fulfillment workflow: Pending &rarr; Accepted &rarr; Packed &rarr; Shipped &rarr; Delivered</td>
    </tr>
    <tr>
      <td><strong>WhatsApp Reminders</strong></td>
      <td><code>/marketing</code></td>
      <td>Production Ready</td>
      <td>Polite payment reminders with customer balance and direct dynamic UPI payment link</td>
    </tr>
    <tr>
      <td><strong>Promotions & Coupons</strong></td>
      <td><code>/marketing</code></td>
      <td>Production Ready</td>
      <td>Percentage and flat coupon codes with minimum order constraints and expiry rules</td>
    </tr>
    <tr>
      <td><strong>Data Backup & Restore</strong></td>
      <td><code>/settings</code></td>
      <td>Production Ready</td>
      <td>Complete 15-collection JSON snapshot export, file restore, and 1-click sample data seeder</td>
    </tr>
    <tr>
      <td><strong>Multi-Tenant RBAC</strong></td>
      <td><code>/superadmin</code>, <code>/settings</code></td>
      <td>Production Ready</td>
      <td>Super Admin dashboard, company partitioning, and 6 role-based permission tiers</td>
    </tr>
  </tbody>
</table>

---

<h1>3. Standalone Point of Sale (POS) Fast Billing</h1>

### 3.1 Terminal Hardware & Layout
- **Fullscreen Kiosk Mode:** Dedicated viewport terminal (100vw × 100vh) with no navigation sidebar to prevent cashier distraction.
- **Top Control Bar:** Live digital clock, store status badge, cashier initial avatar, held carts queue count, sound toggle, and terminal settings dialog.
- **Continuous Rapid Barcode Scanning:** Compatible with any standard USB, Bluetooth, or 2.4GHz handheld scanner operating in HID keyboard wedge mode. When a barcode is read:
  1. Matches product by Barcode, SKU, or Item Code.
  2. Emits an audible confirmation tone via the Web Audio API.
  3. Increments cart quantity by +1 (checking against available stock limits).
  4. Immediately clears the search input for hands-free continuous item ringing.
- **Keyboard Hotkeys:**
  - F2: Instant focus on search input.
  - F4: Open Pay & Tender split-payment dialog.
  - F7: Put current cart on hold.
  - F9: Quick Cash 1-tap checkout.
  - Esc: Close open modal windows.
- **Fast Cash Presets:** Instant denomination buttons (₹100, ₹200, ₹500, ₹2000, Exact Cash).
- **Split Tender Payments:** Customer bills can be split across Cash, UPI / QR, and Card / POS Machine on the same transaction.
- **Thermal Slip Printing:** Built-in print CSS formatted for 80mm (3-inch) and 58mm (2-inch) thermal receipt rolls.

---

<h1>4. Sales, Challans, Quotes & Returns</h1>

### 4.1 Tax Invoices & Place of Supply
- Configurable invoice sequence prefixes (e.g., INV-2026-001).
- Automatic tax detection: Applies CGST + SGST for Intra-State or IGST for Inter-State sales based on customer state vs. company state.
- Dynamic UPI QR code generated on invoice footer with payee VPA, amount, and invoice reference.

### 4.2 Estimates & Quotations Pipeline
- Create draft price quotations for client approval.
- One-click **Convert to Invoice** automatically generates the invoice and deducts physical inventory.

### 4.3 Delivery Challans & Dispatch Slips
- Issue dispatch vouchers with vehicle transport registration numbers, driver details, and delivery addresses.
- Goods remain tracked as "In-Transit" without creating an immediate debt journal entry until converted into a bill.

### 4.4 Credit & Debit Notes
- **Credit Notes (Sales Returns):** Reverse customer sales, re-stock inventory, and adjust customer accounts.
- **Debit Notes (Purchase Returns):** Reverse inward vendor purchases and deduct outstanding payable dues.

---

<h1>5. Inventory, Batches, Units & Warehouses</h1>

### 5.1 Product Master & Dual Units
- Supports base units (pcs, kg, ltr, ox, pkt, m) and secondary units with defined conversion rates (e.g., 1 Box = 12 pcs).
- Tracks HSN/SAC codes, brand names, subcategories, buying cost, and selling price.
- Live stock balance with automated low stock threshold notifications.

### 5.2 Batch & Expiry Date Management (FEFO)
- Tracks Batch Number, Manufacturing Date, and Expiry Date per SKU.
- Visual alerts: Amber warning for stock expiring within 30 days; Red alert for expired stock.
- Enforces First-Expiry-First-Out (FEFO) picking guidelines.

### 5.3 Serial Number / IMEI Tracking
- Comma-separated unique serial number identification for electronic goods and serialized assets.

### 5.4 Stock Adjustments & Damage Audits
- Record inventory count revisions with categorized reason codes:
  - *Damaged / Broken Goods*
  - *Expired Goods*
  - *Theft / Unaccounted Loss*
  - *Physical Audit Variance*
  - *Internal Store Consumption*

### 5.5 Multi-Godowns & Inter-Branch Logistics
- Define multiple warehouse or retail branch physical locations.
- **Stock Transfer Vouchers:** Log goods transfer from Source Godown to Destination Godown with transfer numbers.

### 5.6 Barcode & QR Label Designer
- Generate printable sticker sheets in Code128 barcode or QR format.
- Layout presets: Compact (40-Up), Standard (24-Up), and Large (12-Up) per sheet.

---

<h1>6. Accounting, Ledgers, Banking & GST</h1>

### 6.1 Cash Book & Multi-Bank Accounts
- Monitor petty cash registers, commercial bank current/savings accounts, and digital merchant wallets.
- **Contra Entries:** Account-to-account transfers (Cash Deposit, Cash Withdrawal, Bank-to-Bank).

### 6.2 Operating Expenses & ITC
- Log operational overheads (Rent, Utilities, Staff Salaries, Freight, Repairs).
- Toggle GST Input Tax Credit (ITC) eligibility with vendor GSTIN recording.

### 6.3 Party Ledgers & CRM
- Unified customer and supplier directories with GSTIN, billing addresses, credit limits, and credit periods.
- Interactive **Party Statement of Account** with live running Debit (Dr) / Credit (Cr) balances.

### 6.4 GST Compliance & E-Way Bills
- **GSTR-1:** Complete tables for B2B, B2C Small, CDNR, and HSN Summary with direct NIC-ready JSON export.
- **GSTR-3B:** Consolidated Outward Liability vs. Eligible ITC summary.
- **NIC E-Way Bill:** Auto-formats consignment JSON for transport values > ₹50,000.
- **E-Invoicing:** Generates 64-character IRN hash codes and B2B signed QR code simulation.

---

<h1>7. Reports, Storefront & Administration</h1>

### 7.1 Business Reports & Financial Intelligence
- **Profit & Loss Statement:** Real-time Gross Sales Revenue, COGS, Gross Profit, Operating Expenses, and Net Profit.
- **Balance Sheet:** Total Liquid Assets, Inventory Valuation, Receivables vs. Payables, and Owner Equity.
- **Bill-wise Profit Margins:** Margin percentage breakdown per invoice.
- **Ageing Analysis:** Accounts receivable and payable aging buckets (0-30, 31-60, 61-90, 90+ days).

### 7.2 Digital Web Shop & WhatsApp Orders
- Public web catalog (/store/:companyId) where customers browse products, view pictures, and submit orders.
- Orders management pipeline: Pending &rarr; Accepted &rarr; Packed &rarr; Shipped &rarr; Delivered.
- Automated WhatsApp payment reminders with balance summary and direct UPI payment links.

### 7.3 System Administration & Backup
- **1-Click Sample Business Data Seeder:** Instantly populate realistic demo products, invoices, purchases, bank accounts, godowns, and customers for testing.
- **Full Database JSON Backup & Restore:** Complete export and restore of all 15 Firestore collections.
- **Role-Based Access Control (RBAC):** Super Admin, Admin, Cashier, Accountant, Warehouse Manager, Staff.
