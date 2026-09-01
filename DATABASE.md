# Coreventory — Database Architecture, Schema & Collections Reference

This document provides a comprehensive technical reference for the **Coreventory Enterprise ERP & Billing Platform** database architecture, data models, entity relationships, and collection schemas.

---

## 🏗️ 1. Database Architecture & Technology

- **Database Engine:** Google Cloud Firestore (NoSQL Document Store)
- **Configuration File:** [`src/lib/firebase.js`](file:///c:/Sherwin/projects/invmang/src/lib/firebase.js)
- **Authentication:** Firebase Authentication (mapped via `uid`)
- **Multi-Tenancy Model:** Logical isolation via foreign key `companyId` on all tenant collections, ensuring complete data security and separation between different business accounts.
- **Client Sync:** Real-time listeners (`onSnapshot`) with offline-first caching and terminal device persistence.

---

## 🗺️ 2. Entity-Relationship (ER) Overview

```
                        ┌────────────────────────┐
                        │      [companies]       │
                        └───────────┬────────────┘
                                    │ 1:N
        ┌──────────────┬────────────┼─────────────┬──────────────┬──────────────┐
        ▼              ▼            ▼             ▼              ▼              ▼
   [users]        [products]     [sales]     [purchases]   [customers]    [bank_accounts]
                       │            │             │        [suppliers]          │
                       │            │             │              │              │
                       ├──[Batches] ├──[Items]    ├──[Items]     ├──[Ledgers]   └──[bank_transactions]
                       │            │             │              │                 (Contra transfers)
                       ├──[Godowns] ├──[Payments] ├──[Returns]   └──[Vouchers]
                       │            │
                       └──[Adjust]  └──[EWayBills]
```

---

## 📋 3. Complete Collections ("Tables") Reference

---

### 3.1 `companies` (Master Tenant Profile)
Stores company profile details, institutional metadata, and default tax configurations.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` / `docId` | `String` | Unique company identifier (`companyId`) |
| `companyName` | `String` | Registered legal business title |
| `businessName` | `String` | Trade / display name |
| `gstin` | `String` | 15-digit GST identification number |
| `state` | `String` | Operating state (e.g. `Maharashtra`) for GST auto-detection |
| `gstScheme` | `String` | Tax Scheme: `'Regular'` or `'Composition'` |
| `reverseChargeDefault` | `Boolean` | Default RCM toggle |
| `phone` | `String` | Official business contact number |
| `email` | `String` | Official correspondence email |
| `address` | `String` | Physical street address |
| `city` | `String` | City name |
| `pincode` | `String` | Postal code |
| `logoURL` | `String` | Public URL for company logo printed on invoices |
| `upiId` | `String` | UPI VPA handle (e.g. `merchant@upi`) for dynamic invoice QR codes |
| `bankName` | `String` | Bank name printed on invoice footers |
| `accountNumber` | `String` | Bank account number for wire transfers |
| `ifscCode` | `String` | IFSC code |
| `defaultPrintTemplate` | `String` | Default format: `'thermal'` (80mm/58mm) or `'a4'` |
| `terms` | `String` | Default terms & conditions on invoices |
| `createdAt` | `Timestamp` | Registration timestamp |

---

### 3.2 `users` (Staff & Role-Based Access Control)
Stores user credentials and role permissions.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `uid` | `String` | Firebase Authentication User ID |
| `name` | `String` | Full name of the user |
| `email` | `String` | Login email address |
| `phone` | `String` | Contact number |
| `companyId` | `String` | Foreign key linking user to their company |
| `role` | `String` | User role: `'superadmin'`, `'admin'`, `'cashier'`, `'accountant'`, `'warehouse_manager'`, or `'staff'` |
| `isActive` | `Boolean` | Account status flag |
| `createdAt` | `Timestamp` | Creation date |

---

### 3.3 `products` (Product Master & Inventory Catalog)
Stores products, pricing, stock levels, batches, and barcodes.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `name` | `String` | Product title |
| `sku` | `String` | Unique item code / SKU for barcode scanning |
| `barcode` | `String` | Barcode / EAN-13 / Code128 number for POS scanners |
| `brand` | `String` | Brand / Manufacturer |
| `category` | `String` | Category (e.g. `Electronics`, `Pharma`, `Groceries`) |
| `subcategory` | `String` | Subcategory |
| `hsn` | `String` | HSN / SAC GST tax code |
| `unit` | `String` | Primary unit: `pcs`, `kg`, `box`, `ltr`, `m`, `pkt` |
| `secondaryUnit` | `String` | Optional dual conversion unit (e.g. `box`) |
| `conversionFactor` | `Number` | Multiplier factor (e.g. `1 Box = 12 pcs`) |
| `buyingPrice` | `Number` | Purchase / Cost rate |
| `sellingPrice` | `Number` | Selling / MRP price |
| `gstPercent` | `Number` | Tax slab: `0`, `5`, `12`, `18`, `28` (%) |
| `stock` | `Number` | Live available quantity count |
| `lowStockThreshold` | `Number` | Low stock alert trigger level |
| `hasBatch` | `Boolean` | Batch & Expiry tracking enabled flag |
| `batchNumber` | `String` | Batch identification number |
| `mfgDate` | `String` | Manufacturing date (`YYYY-MM-DD`) |
| `expiryDate` | `String` | Expiry date (`YYYY-MM-DD`) |
| `hasSerial` | `Boolean` | Serial / IMEI tracking flag |
| `serialNumbers` | `String` | Comma-separated serial numbers |
| `godownId` | `String` | Storage warehouse allocation (`'main'` or godown ID) |
| `createdAt` | `Timestamp` | Record creation timestamp |
| `updatedAt` | `Timestamp` | Last stock update timestamp |

---

### 3.4 `sales` (Invoices & POS Fast Billing)
Stores standard tax invoices and POS counter bills.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `invoiceNumber` / `invoiceNo` | `String` | Custom invoice sequence (e.g. `INV-0012` or `POS-829102`) |
| `date` | `Timestamp` | Transaction date |
| `customerId` | `String` | Foreign key to `customers` (optional for walk-ins) |
| `customerName` | `String` | Customer name |
| `customerPhone` | `String` | Customer phone number |
| `customerGSTIN` | `String` | Customer GSTIN (for B2B) |
| `partyState` | `String` | State of supply |
| `isInterState` | `Boolean` | `true` for IGST, `false` for CGST+SGST |
| `items` | `Array<Object>` | Line items: `[{ productId, name, sku, price, buyingPrice, qty, gstPercent, unit, batchNumber, total }]` |
| `subtotal` | `Number` | Gross items total |
| `discountPercent` | `Number` | Flat percentage discount |
| `discountAmount` | `Number` | Discount value in ₹ |
| `totalTax` | `Number` | Total calculated GST |
| `cgstTotal`, `sgstTotal`, `igstTotal` | `Number` | Split tax amounts |
| `roundOff` | `Number` | Decimal round-off adjustment |
| `grandTotal` / `total` | `Number` | Net payable invoice amount |
| `saleType` | `String` | Mode: `'Cash'`, `'UPI'`, `'Card'`, `'Split'`, `'Due'` |
| `paymentDetails` | `Object` | Tender breakdown: `{ mode, tendered: { cash, upi, card } }` |
| `source` | `String` | Source: `'POS'` or `'Standard'` |
| `cashier` | `String` | Staff member who billed the sale |

---

### 3.5 `purchases` (Purchase Bills & Inward Stock)
Stores inward purchase orders and vendor bills.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `billNumber` / `invoiceNo` | `String` | Vendor invoice/bill reference |
| `supplierId` | `String` | Foreign key to `suppliers` |
| `supplierName` | `String` | Vendor name |
| `supplierPhone` | `String` | Vendor contact |
| `supplierGSTIN` | `String` | Vendor GSTIN |
| `date` | `Timestamp` | Purchase date |
| `items` | `Array<Object>` | Inward items (auto-adds to stock) |
| `taxableTotal` | `Number` | Taxable purchase value |
| `grandTotal` / `amount` | `Number` | Total bill amount |
| `paymentMode` | `String` | Payment method: `'Cash'`, `'Bank Transfer'`, `'Credit'` |

---

### 3.6 `customers` & `suppliers` (CRM & Party Ledgers)
Stores client and vendor profiles.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `name` | `String` | Party / Business title |
| `phone` | `String` | Phone number |
| `email` | `String` | Email address |
| `gstin` | `String` | 15-digit GSTIN |
| `state` | `String` | State of registration |
| `category` | `String` | Classification: `'Retailer'`, `'Wholesaler'`, or `'Distributor'` |
| `creditLimit` | `Number` | Maximum credit limit allowable |
| `creditPeriodDays` | `Number` | Payment due period in days (e.g. `30`) |
| `creditBalance` | `Number` | Live outstanding balance owed |
| `totalSpent` / `totalPurchases` | `Number` | Lifetime business volume |
| `address` | `String` | Business location |
| `createdAt` | `Timestamp` | Record creation timestamp |

---

### 3.7 `bank_accounts` (Cash Book & Bank Accounts)
Stores cash registers, bank accounts, and digital wallets.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `accountName` | `String` | Display name (e.g. `'Cash in Hand'`, `'HDFC Current A/C'`) |
| `accountType` | `String` | `'Cash Register'`, `'Bank Account'`, or `'Digital Wallet'` |
| `bankName` | `String` | Financial institution name |
| `accountNumber` | `String` | Account number |
| `ifscCode` | `String` | IFSC code |
| `openingBalance` | `Number` | Opening balance amount |
| `currentBalance` | `Number` | Real-time computed balance |
| `createdAt` | `Timestamp` | Registration timestamp |

---

### 3.8 `bank_transactions` (Contra Transfers)
Stores inter-account fund transfers (Cash &harr; Bank &harr; Wallet).

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `transferNo` | `String` | Voucher code (`CNT-XXXXXX`) |
| `fromAccountId` | `String` | Source account ID |
| `fromAccountName` | `String` | Source account title |
| `toAccountId` | `String` | Destination account ID |
| `toAccountName` | `String` | Destination account title |
| `type` | `String` | `'Bank to Cash'`, `'Cash to Bank'`, `'Bank to Bank'` |
| `amount` | `Number` | Transfer sum |
| `date` | `String` | Transfer date (`YYYY-MM-DD`) |
| `notes` | `String` | Remarks |

---

### 3.9 `expenses` (Overhead & Operating Expenses)
Stores direct and indirect business overheads with GST ITC tracking.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `expenseNo` | `String` | Voucher code (`EXP-XXXXXX`) |
| `title` | `String` | Expense description (e.g. `'Office Rent'`) |
| `category` | `String` | Classification (e.g. `'Rent & Utilities'`, `'Salaries'`, `'Logistics'`) |
| `amount` | `Number` | Total expense value |
| `isItcEligible` | `Boolean` | `true` if eligible for GST Input Tax Credit |
| `vendorGSTIN` | `String` | Vendor GSTIN |
| `gstPercent` | `Number` | GST rate (5%, 12%, 18%, 28%) |
| `paymentMode` | `String` | Method: `'Cash'`, `'Bank Transfer'`, `'UPI'`, `'Credit Card'` |
| `date` | `String` | Expense date (`YYYY-MM-DD`) |

---

### 3.10 `payment_vouchers` (Payment In & Out)
Stores receipts for customer settlements and supplier payouts.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `voucherNo` | `String` | Code (`REC-XXXXXX` or `PAY-XXXXXX`) |
| `voucherType` | `String` | `'payment_in'` (Customer receipt) or `'payment_out'` (Supplier payout) |
| `partyId` | `String` | Foreign key to `customers` or `suppliers` |
| `partyName` | `String` | Party title |
| `amount` | `Number` | Settled payment amount |
| `paymentMode` | `String` | `'Cash'`, `'Bank Transfer'`, `'UPI'`, `'Cheque'` |
| `accountId` | `String` | Linked bank/cash account ID |
| `referenceNo` | `String` | Cheque number / UTR transaction code |
| `date` | `String` | Payment date (`YYYY-MM-DD`) |

---

### 3.11 `challans` (Delivery Challans & Dispatch Slips)
Stores goods movement vouchers prior to financial invoicing.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `challanNo` | `String` | Code (`DC-XXXXXX`) |
| `customerName` | `String` | Consignee name |
| `customerPhone` | `String` | Consignee phone |
| `deliveryAddress` | `String` | Destination location |
| `vehicleNo` | `String` | Vehicle transport number |
| `driverName` | `String` | Driver name |
| `items` | `Array<Object>` | Dispatched goods list `[{ productId, name, qty, unit }]` |
| `status` | `String` | `'Dispatched'`, `'Delivered'`, `'Invoiced'` |
| `date` | `String` | Dispatch date |

---

### 3.12 `returns_notes` (Credit & Debit Notes)
Stores Sales Returns (Credit Notes) and Purchase Returns (Debit Notes).

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `noteNo` | `String` | Code (`CN-XXXXXX` or `DN-XXXXXX`) |
| `noteType` | `String` | `'credit'` (Sale Return) or `'debit'` (Purchase Return) |
| `referenceInvoiceId` | `String` | Foreign key to original invoice/bill |
| `originalDocNo` | `String` | Original invoice/bill reference number |
| `partyName` | `String` | Customer or supplier name |
| `reason` | `String` | Reason (e.g. `'Damaged / Defective Goods'`) |
| `items` | `Array<Object>` | Returned goods (automatically adjusts stock) |
| `refundType` | `String` | `'Credit to Account'` or `'Cash Refund'` |
| `totalAmount` | `Number` | Total return value |
| `date` | `String` | Return date |

---

### 3.13 `stock_adjustments` (Audit Variance & Damage Logs)
Stores manual stock count modifications.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `companyId` | `String` | Tenant ID |
| `productId` | `String` | Foreign key to `products` |
| `productName` | `String` | Product title |
| `type` | `String` | `'Increase'` or `'Decrease'` |
| `adjustmentQty` | `Number` | Quantity changed |
| `stockBefore` | `Number` | Quantity before adjustment |
| `stockAfter` | `Number` | Quantity after adjustment |
| `reason` | `String` | `'Damaged'`, `'Expired'`, `'Theft'`, `'Audit Variance'`, `'Internal Consumption'` |
| `adjustedBy` | `String` | Staff member who adjusted stock |
| `date` | `String` | Adjustment date |

---

### 3.14 `godowns` & `godown_transfers` (Multi-Warehouse)
Stores warehouse physical locations and inter-branch movement vouchers.

- **`godowns` Schema:**
  - `companyId`, `name`, `location`, `managerName`, `contactPhone`, `createdAt`
- **`godown_transfers` Schema:**
  - `transferNo` (`TR-XXXXXX`), `companyId`, `sourceGodownId`, `sourceGodownName`, `destGodownId`, `destGodownName`, `productId`, `productName`, `quantity`, `date`, `transferredBy`

---

### 3.15 `online_orders` & `promotions` (Storefront & Marketing)
Stores public catalog orders and promo codes.

- **`online_orders` Schema:**
  - `orderNo` (`WEB-XXXXXX`), `companyId`, `customerName`, `customerPhone`, `deliveryAddress`, `notes`, `items`, `totalAmount`, `status` (`Pending`, `Accepted`, `Packed`, `Shipped`, `Delivered`, `Invoiced`), `createdAt`
- **`promotions` Schema:**
  - `companyId`, `code` (`SAVE10`), `discountType` (`percentage`/`flat`), `discountValue`, `minOrderValue`, `expiryDate`, `isActive`

---

## 💻 4. Client-Side State & Hardware Storage

For offline speed and hardware counter resilience, InvMang stores terminal device settings locally:

| Storage Key | Storage Engine | Purpose | Structure |
| :--- | :--- | :--- | :--- |
| `pos_config_${companyId}` | `localStorage` | POS hardware settings | `{ receiptFormat: 'thermal80', autoPrint: true, soundEnabled: true, quickCashButtons: true }` |
| `held_carts_${companyId}` | `localStorage` | Queued held carts | `[{ id, time, customerName, cart: [...], discountPercent }]` |
| `theme` | `localStorage` | Active UI theme | `'dark'` or `'light'` |

---

## 🔒 5. Full Database JSON Backup Structure

```json
{
  "version": "1.0",
  "exportDate": "2026-08-27T13:56:00.000Z",
  "companyId": "tenant_12345",
  "companyProfile": { ... },
  "data": {
    "products": [ ... ],
    "sales": [ ... ],
    "purchases": [ ... ],
    "customers": [ ... ],
    "suppliers": [ ... ],
    "expenses": [ ... ],
    "bank_accounts": [ ... ],
    "challans": [ ... ],
    "returns_notes": [ ... ],
    "stock_adjustments": [ ... ],
    "godowns": [ ... ],
    "promotions": [ ... ],
    "online_orders": [ ... ]
  }
}
```
