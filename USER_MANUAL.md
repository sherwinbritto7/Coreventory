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
    font-size: 16pt;
    font-weight: 700;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
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
  <div class="pdf-subtitle">Comprehensive User Manual & Standard Operating Procedures Guide</div>
  <p>An official step-by-step operational guide covering Point of Sale (POS) fast billing, inventory logistics, financial accounting, banking, GST compliance, and system administration.</p>

  <table class="pdf-meta-table">
    <tr>
      <td><strong>Application Name:</strong> Coreventory Enterprise ERP</td>
      <td><strong>Document Type:</strong> User Manual & Operations Guide</td>
    </tr>
    <tr>
      <td><strong>Document Version:</strong> 2.4.0 (Enterprise)</td>
      <td><strong>Supported Devices:</strong> Desktop, POS Kiosk, Tablet</td>
    </tr>
    <tr>
      <td><strong>Recommended Browsers:</strong> Google Chrome, Microsoft Edge, Safari</td>
      <td><strong>Hardware Compatibility:</strong> USB/BT Scanners, 58mm/80mm Thermal Printers</td>
    </tr>
    <tr>
      <td><strong>Document Status:</strong> Complete / PDF-Ready</td>
      <td><strong>Last Updated:</strong> August 2026</td>
    </tr>
  </table>
</div>

<h1 class="no-break-before">📑 Table of Contents</h1>

1. [Getting Started & Authentication](#1-getting-started--authentication)
2. [Point of Sale (POS) Standalone Terminal](#2-point-of-sale-pos-standalone-terminal)
   - 2.1 Full-Screen Terminal Interface
   - 2.2 Barcode Scanning & Hardware Setup
   - 2.3 Keyboard Shortcuts Reference
   - 2.4 POS Terminal Configuration Settings
   - 2.5 Fast Cash, Tender Splitting & Thermal Receipts
   - 2.6 Cart Hold & Retrieve Queue
3. [Sales & Invoicing Workflows](#3-sales--invoicing-workflows)
   - 3.1 Tax Invoices
   - 3.2 Quotations & Estimates
   - 3.3 Delivery Challans & Packing Slips
   - 3.4 Sales Returns (Credit Notes) & Purchase Returns (Debit Notes)
4. [Inventory & Warehouse Management](#4-inventory--warehouse-management)
   - 4.1 Adding Products & Dual Unit Conversion
   - 4.2 Batch & Expiry Date Tracking (FEFO)
   - 4.3 Serial Number / IMEI Tracking
   - 4.4 Stock Adjustments & Damage/Waste Logging
   - 4.5 Multi-Godowns & Inter-Branch Stock Transfers
   - 4.6 Barcode & QR Label Designer
5. [Accounting, Ledgers & Banking](#5-accounting-ledgers--banking)
   - 5.1 Cash Book & Multi-Bank Accounts
   - 5.2 Contra Entries (Account Transfers)
   - 5.3 Expense Tracker with GST ITC Claims
   - 5.4 Payment In (Customer Receipts) & Payment Out (Vendor Payouts)
   - 5.5 Customer & Supplier Directory with Party Ledgers
6. [GST Compliance, E-Way Bills & E-Invoicing](#6-gst-compliance-e-way-bills--e-invoicing)
   - 6.1 GSTR-1 Return Filing Tables & JSON Export
   - 6.2 GSTR-3B Consolidated Summary
   - 6.3 NIC E-Way Bill JSON Generator
   - 6.4 B2B E-Invoicing (IRN & Signed QR)
7. [Business Reports & Financial Intelligence](#7-business-reports--financial-intelligence)
   - 7.1 Profit & Loss Statement
   - 7.2 Balance Sheet
   - 7.3 Bill-wise Profit Margins
   - 7.4 Receivables & Payables Ageing (30/60/90 Days)
8. [Digital Storefront & Online Orders](#8-digital-storefront--online-orders)
   - 8.1 Public Mini Web Shop
   - 8.2 Online & WhatsApp Order Processing
   - 8.3 WhatsApp Payment Reminders with UPI QR
   - 8.4 Discount Coupons & Promotional Schemes
9. [System Settings, Backup & Team Access](#9-system-settings-backup--team-access)
   - 9.1 Company Profile & GST Settings
   - 9.2 Bank Details for Dynamic Invoice QR Codes
   - 9.3 1-Click Sample Business Data Seeder
   - 9.4 Full JSON Database Backup & Restore
   - 9.5 Staff Roles & Permissions (RBAC)

---

<h1>1. Getting Started & Authentication</h1>

### 1.1 Accessing the Application
1. Navigate to your Coreventory application URL in any modern web browser (Google Chrome, Microsoft Edge, Safari, or Mozilla Firefox).
2. Enter your registered **Email Address** and **Password**.
3. Click **Login to Workspace**.
4. Based on your assigned role (Super Admin, Admin, Cashier, Accountant, Warehouse Manager, or Staff), the system directs you to your authorized dashboard workspace.

### 1.2 Multi-Tenant Workspace Verification
- In the top navigation title bar, verify that your active company name is displayed (e.g. Apex Retail & Traders > Dashboard).
- The system logically isolates all customer records, invoices, accounts, and inventory stock to your specific company identifier (companyId).

---

<h1>2. Point of Sale (POS) Standalone Terminal</h1>

**Route:** /pos

The POS module opens in a **dedicated, standalone, full-screen retail counter view** (100vw × 100vh) with no distracting sidebars. It is designed for ultra-fast checkout workflows with barcode scanners, touchscreen category grids, and split payments.

### 2.1 Full-Screen Terminal Interface
- **Exit POS:** Click **Exit POS** in the top left to return to the management dashboard.
- **Terminal Status:** Displays live online connection status and current cashier name.
- **Live Digital Clock:** Real-time clock and date display (HH:mm:ss · DD MMM YYYY).
- **Fullscreen Kiosk Mode:** Click the **Maximize** icon in the navbar to enter full-screen counter mode.

### 2.2 Barcode Scanning & Hardware Setup
Coreventory supports all standard **USB, Bluetooth, and Wireless (2.4GHz)** plug-and-play barcode scanners (acting as standard HID keyboard input devices).

#### **How Scanning Works:**
1. **Continuous Rapid Scanning (Hands-Free):** Simply point your barcode scanner at any product barcode and press the trigger.
   - The system automatically matches the **Barcode**, **SKU**, or **Item Code**.
   - Plays an **Audio Beep** confirmation tone synthesized via the Web Audio API.
   - Adds the item to the cart (or increments quantity by +1).
   - Clears the search field immediately, ready for the next scan.
2. **Hotkey Focus (F2):** Press **F2** on your keyboard to instantly focus the search input for typing a product name, SKU, or manual barcode. Press **Enter** to add to cart.

### 2.3 Keyboard Shortcuts Reference

<table>
  <thead>
    <tr>
      <th>Hotkey</th>
      <th>Function</th>
      <th>Operational Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>F2</code></strong></td>
      <td>Focus Search / Scanner</td>
      <td>Instantly focuses the product search and barcode input field.</td>
    </tr>
    <tr>
      <td><strong><code>F4</code></strong></td>
      <td>Pay & Tender</td>
      <td>Opens the tender split-payment modal (Cash, UPI QR, Card).</td>
    </tr>
    <tr>
      <td><strong><code>F7</code></strong></td>
      <td>Hold Cart</td>
      <td>Puts the active cart on hold and queues it in the top navbar.</td>
    </tr>
    <tr>
      <td><strong><code>F9</code></strong></td>
      <td>Quick Cash Checkout</td>
      <td>Executes 1-click exact cash checkout and triggers print.</td>
    </tr>
    <tr>
      <td><strong><code>Esc</code></strong></td>
      <td>Close / Return</td>
      <td>Closes any open modal dialog and refocuses the active cart.</td>
    </tr>
  </tbody>
</table>

### 2.4 POS Terminal Configuration Settings (⚙️)
Click the **Settings (⚙️)** icon on the POS top navbar to configure:
- **Default Receipt Format:** Choose between **Thermal POS Printer (80mm / 3-inch)**, **Compact Thermal Printer (58mm / 2-inch)**, or **Standard Desktop A4 / A5**.
- **Auto-Print on Checkout:** Automatically triggers the system print dialog when a sale is completed.
- **Barcode Audio Beep:** Toggle Web Audio API synthesized audio tone on item scan/addition.
- **Fast Cash Presets:** Show/hide quick denomination buttons (₹100, ₹200, ₹500, ₹2000, Exact).

### 2.5 Fast Cash, Tender Splitting & Thermal Receipts
1. **Fast Cash (F9):** Click **Cash (F9)** or tap any fast denomination button (₹100, ₹500, Exact) for instantaneous cash sale recording.
2. **Pay & Tender (F4):** Open the tender modal to split payments across **Cash**, **UPI / QR**, and **Card / POS Terminal**.
   - When **UPI** is selected, a dynamic UPI QR code is rendered on-screen with the exact bill total.
3. **Receipt Print:** Outputs a clean, condensed receipt with store header, item breakdown, tax totals, and thank you footer.

### 2.6 Cart Hold & Retrieve Queue
- If a customer needs to pick more items, press **F7** or click **Hold**. The cart is saved with timestamp and customer name.
- Click any held cart badge (#1, #2) in the top navbar to resume billing that customer at any time.

---

<h1>3. Sales & Invoicing Workflows</h1>

### 3.1 Creating a Tax Invoice
**Route:** /sales/new
1. Enter Customer details (Name, Phone, Address, GSTIN).
2. Select invoice items from the dropdown or scan barcodes.
3. Tax (CGST + SGST or IGST) is automatically detected based on the customer's state vs. your company state.
4. Set Payment Mode (Cash, UPI, Bank Transfer, Cheque, Due/Credit).
5. Click **Generate Invoice**. You can share via WhatsApp or download PDF.

### 3.2 Quotations & Estimates
**Route:** /quotations
- Generate formal price estimates for prospective buyers.
- When the customer approves the quote, click **Convert to Invoice** to instantly turn it into an active sales invoice without re-typing.

### 3.3 Delivery Challans & Packing Slips
**Route:** /challans
- Record goods dispatch for transport without affecting ledger balances immediately.
- Enter vehicle number, driver name, and transport destination.
- Once confirmed delivered, click **Convert to Invoice** to record the financial sale.

### 3.4 Sales Returns (Credit Notes) & Purchase Returns (Debit Notes)
**Route:** /returns
- **Sales Return (Credit Note):** Select the original sales invoice, choose returned items and quantities. The system automatically restocks the items into inventory and credits the customer's account balance or records a cash refund.
- **Purchase Return (Debit Note):** Select the original purchase bill, choose returned items. Stock is deducted and vendor payable balance is adjusted automatically.

---

<h1>4. Inventory & Warehouse Management</h1>

### 4.1 Adding Products & Dual Unit Conversion
**Route:** /inventory
1. Click **Add Product**.
2. Enter Product Name, Brand, SKU, Barcode, Category, Subcategory, and HSN/SAC code.
3. Select the **Base Unit** (e.g. pcs).
4. (Optional) Choose a **Secondary Unit** (e.g. ox) and specify the conversion rate (e.g. 1 Box = 12 pcs).
5. Set Buying Price, Selling Price, and GST Rate slab (0%, 5%, 12%, 18%, 28%).
6. Enter opening stock and low stock alert threshold.

### 4.2 Batch & Expiry Date Tracking (FEFO)
1. In the product form, check **Enable Batch & Expiry Date Tracking**.
2. Enter the **Batch Number**, **Manufacturing Date**, and **Expiry Date**.
3. In the inventory table, items expiring within 30 days receive an amber **"Expiring in X days"** badge, and expired items receive a red **"Expired"** warning.

### 4.3 Serial Number / IMEI Tracking
- Check **Serial Number / IMEI Tracking** to record individual serial identifiers (comma-separated) for high-value electronics.

### 4.4 Stock Adjustments & Damage Logging
**Route:** /inventory/adjustments
1. Click **Record Stock Adjustment**.
2. Select the product, choose **Increase (+)** or **Decrease (-)**, and enter the quantity.
3. Select the reason: Damaged / Broken Goods, Expired Goods, Theft / Loss, Physical Audit Variance, or Internal Store Consumption.
4. The system updates stock levels and creates a permanent audit log entry showing before and after quantities.

### 4.5 Multi-Godowns & Inter-Branch Stock Transfers
**Route:** /inventory/godowns
- **Add Godowns:** Register physical branch locations, warehouse addresses, and branch managers.
- **Stock Transfer Voucher:** Click **Transfer Stock**, select **Source Godown (From)**, **Destination Godown (To)**, product, and transfer quantity to log stock movement.

### 4.6 Barcode & QR Label Designer
**Route:** /inventory/barcodes
1. Select items to print and adjust quantity counts.
2. Select format: **Barcode (Code 128)** or **QR Code**.
3. Choose sheet layout: **Compact (40-Up Sheet)**, **Standard (24-Up Sheet)**, or **Large (12-Up Sheet)**.
4. Toggle MRP price and Company Name visibility.
5. Click **Print Labels** to print bulk sticker sheets.

---

<h1>5. Accounting, Ledgers & Banking</h1>

### 5.1 Cash Book & Multi-Bank Accounts
**Route:** /banking
- Track your liquid funds across **Cash in Hand (Petty Cash)**, **Bank Current/Savings Accounts** (HDFC, SBI, ICICI), and **Digital Wallets** (Paytm, UPI).
- View live account balances and overall liquid cash position.

### 5.2 Contra Transfers
**Route:** /banking &rarr; Click **Contra Transfer**
- Record transfers between internal accounts:
  - **Cash Withdrawal:** Bank to Cash
  - **Cash Deposit:** Cash to Bank
  - **Inter-Bank Transfer:** Bank A to Bank B

### 5.3 Expense Tracker with GST ITC
**Route:** /expenses
1. Click **Record Expense**.
2. Enter Title (e.g. Office Rent, Electricity, Staff Salaries, Freight).
3. Enter amount, date, and payment mode.
4. If the expense is eligible for GST Input Tax Credit, check **GST ITC Eligible**, select the tax rate, and enter the vendor GSTIN.

### 5.4 Payment In & Payment Out Vouchers
**Route:** /payments
- **Payment In (Receipt):** Record when a customer settles an invoice or makes an advance payment. Updates customer due balance and deposits money into your selected bank/cash register.
- **Payment Out (Payout):** Record vendor payouts against purchase bills.

### 5.5 Customer & Supplier Directory with Party Ledgers
**Route:** /customers and /suppliers
- **Credit Limits:** Set a maximum credit ceiling. If a customer exceeds the limit, a warning alert is displayed.
- **Credit Period:** Set payment due terms (e.g. 30 Days Due).
- **Party Ledger Statement:** Click the **Ledger** button next to any party to open their interactive Statement of Account showing all Invoices, Payments, Returns, and a live running **Debit (Dr) / Credit (Cr)** balance.

---

<h1>6. GST Compliance, E-Way Bills & E-Invoicing</h1>

**Route:** /gst-reports

### 6.1 GSTR-1 Return Filing
- **Section 4A (B2B):** Invoices issued to GST-registered businesses.
- **Section 7 (B2C Small):** Retail sales to unregistered consumers.
- **Section 9B (CDNR):** Credit and Debit notes issued.
- **Section 12 (HSN Summary):** Quantity and tax totals aggregated by HSN code.
- Click **Download GSTR-1 JSON** to get a ready-to-upload file for the official GST Portal ([gst.gov.in](https://gst.gov.in)), or click **CSV Export** for spreadsheets.

### 6.2 GSTR-3B Summary
- View monthly consolidated **Table 3.1 Outward Tax Liability** vs. **Table 4 Eligible Input Tax Credit (ITC)**.
- See your exact **Net GST Payable in Cash**.

### 6.3 NIC E-Way Bill JSON Generator
1. Switch to the **E-Way Bill Generator** tab.
2. Select any invoice with total value > ₹50,000.
3. Enter Transporter Name, Transporter ID, Vehicle Number, and distance in KM.
4. Click **Export E-Way Bill JSON** and upload directly on [ewaybillgst.gov.in](https://ewaybillgst.gov.in) to generate official E-Way Bill numbers in bulk.

### 6.4 B2B E-Invoicing (IRN & QR)
- Select a B2B sales invoice and click **Generate E-Invoice IRN & Signed QR** to simulate or generate 64-character hash strings and signed QR images.

---

<h1>7. Business Reports & Financial Intelligence</h1>

**Route:** /reports

- **Profit & Loss Statement:** Shows Total Sales Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Overhead Expenses, and Net Profit before tax.
- **Balance Sheet:** Summarizes total Liquid Assets (Cash + Bank), Inventory Asset Value, and Accounts Receivable vs. Accounts Payable and Net Owner Equity.
- **Bill-wise Profit Margin:** Displays invoice-by-invoice profit and margin percentages.
- **Receivables & Payables Ageing:** Breaks down outstanding dues into aging buckets: **0-30 Days**, **31-60 Days**, **61-90 Days**, and **90+ Days (Overdue)**.

---

<h1>8. Digital Storefront & Online Orders</h1>

### 8.1 Public Mini Web Shop
**URL:** /store/:companyId or /store
- Share your public store link with your customers via WhatsApp, Instagram, or SMS.
- Customers can browse product photos, filter by category, add items to their cart, and click **Order via WhatsApp** or submit an online order directly.

### 8.2 Online Order Processing
**Route:** /orders
- View incoming web/WhatsApp orders.
- Update shipment pipeline: Pending &rarr; Accepted &rarr; Packed &rarr; Shipped &rarr; Delivered.
- Click **Convert to Invoice** to turn an online order into a tax invoice and deduct stock automatically.

### 8.3 WhatsApp Payment Reminders with UPI QR
**Route:** /marketing
1. Select any customer with pending dues.
2. The system automatically creates a polite WhatsApp message with their exact balance and an embedded live **UPI Instant Payment Link** (using your configured UPI ID).
3. Click **Open in WhatsApp & Send Reminder** to launch WhatsApp Web/App with pre-filled text.

### 8.4 Promotional Coupons
**Route:** /marketing &rarr; **Discount Coupons & Schemes**
- Create percentage or flat amount discount coupon codes (e.g. SAVE10, FESTIVE500) with minimum order value and expiry date constraints.

---

<h1>9. System Settings, Backup & Team Access</h1>

**Route:** /settings

### 9.1 Company Profile & GST Configuration
- Enter Business Name, Official Address, Phone, Email, Logo Image URL, and default Terms & Conditions.
- Configure your **GSTIN**, **Operating State**, and tax scheme (**Regular** vs. **Composition**).

### 9.2 Bank Details for Invoice QR Codes
- Enter your **UPI ID (VPA)** (e.g. merchant@okhdfcbank). Every invoice generated will automatically include a dynamic UPI QR code that customers can scan using Google Pay, PhonePe, or Paytm.
- Enter Bank Name, Account Number, and IFSC code for wire transfer printing.

### 9.3 1-Click Sample Business Data Seeder
- Under **Settings &rarr; Backup & Restore**, click **Populate Sample Business Data**.
- Instantly seeds demo products, sales, purchases, expenses, bank accounts, godowns, and customers across all 15 Firestore collections for effortless evaluation.

### 9.4 Full Database Backup & Restore
- **Export Backup:** Click **Export Full Database Backup (JSON)** to download a complete, timestamped JSON snapshot containing all products, invoices, purchases, parties, expenses, accounts, challans, returns, and godowns.
- **Restore from Backup:** Select a previously downloaded JSON file to restore or migrate your entire business database in seconds.

### 9.5 Staff Roles & Permissions (RBAC)
**Route:** /settings &rarr; **Staff & Access**
- Invite team members and assign specific roles:
  - **Super Admin:** Full platform multi-company administration.
  - **Admin:** Complete access to all company features, settings, and financials.
  - **Cashier:** Restricted to POS fast billing, sales entries, and customer directory.
  - **Accountant:** Access to banking, expenses, payment vouchers, GST reports, and financial statements.
  - **Warehouse Manager:** Access to inventory, stock adjustments, godowns, challans, and barcode generator.
  - **Staff:** Standard day-to-day sales and inventory operations.
