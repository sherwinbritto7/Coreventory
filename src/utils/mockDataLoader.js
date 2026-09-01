import { db } from '../lib/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

export const seedMockData = async (companyId, companyName = 'Apex Retail & Traders') => {
  if (!companyId) throw new Error('Company ID is required');

  const batch = writeBatch(db);

  // 1. Company Profile
  const companyRef = doc(db, 'companies', companyId);
  batch.set(companyRef, {
    companyId,
    companyName: companyName || 'Apex Retail & Traders',
    businessName: companyName || 'Apex Retail & Traders',
    gstin: '27AABCA1234F1Z5',
    state: 'Maharashtra',
    gstScheme: 'Regular',
    reverseChargeDefault: false,
    phone: '+91 98201 23456',
    email: 'info@apexretail.in',
    address: 'Plot 42, Commercial Hub, Andheri East',
    city: 'Mumbai',
    pincode: '400069',
    upiId: 'apexretail@okhdfcbank',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088991122',
    ifscCode: 'HDFC0001042',
    defaultPrintTemplate: 'thermal',
    terms: '1. Goods once sold will not be taken back.\n2. Subject to Mumbai jurisdiction.\n3. Interest @ 18% p.a. will be charged after 30 days.'
  }, { merge: true });

  const settingsRef = doc(db, 'settings', companyId);
  batch.set(settingsRef, {
    companyId,
    businessName: companyName || 'Apex Retail & Traders',
    gstin: '27AABCA1234F1Z5',
    state: 'Maharashtra',
    gstScheme: 'Regular',
    phone: '+91 98201 23456',
    email: 'info@apexretail.in',
    address: 'Plot 42, Commercial Hub, Andheri East, Mumbai - 400069',
    upiId: 'apexretail@okhdfcbank',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088991122',
    ifscCode: 'HDFC0001042',
    defaultPrintTemplate: 'thermal',
    terms: '1. Goods once sold will not be taken back.\n2. Subject to Mumbai jurisdiction.'
  }, { merge: true });

  // 2. Godowns
  const godowns = [
    {
      id: `${companyId}_godown_1`,
      name: 'Main Central Godown',
      location: 'Warehouse Unit 4, Bhiwandi Logistics Park',
      managerName: 'Rajesh Patil',
      contactPhone: '+91 98201 99881',
      companyId
    },
    {
      id: `${companyId}_godown_2`,
      name: 'City Storefront Outlet',
      location: 'Shop 12, Link Road, Andheri West',
      managerName: 'Sanjay Verma',
      contactPhone: '+91 98201 99882',
      companyId
    }
  ];
  godowns.forEach(g => {
    batch.set(doc(db, 'godowns', g.id), g);
  });

  // 3. Products
  const products = [
    {
      id: `${companyId}_prod_1`,
      name: 'Logitech Wireless Mouse M220',
      sku: 'LOG-M220-BLK',
      barcode: '890103001001',
      brand: 'Logitech',
      category: 'Electronics',
      subcategory: 'Computer Peripherals',
      hsn: '8471',
      unit: 'pcs',
      secondaryUnit: 'box',
      conversionFactor: 10,
      buyingPrice: 650,
      sellingPrice: 999,
      gstPercent: 18,
      stock: 45,
      lowStockThreshold: 10,
      hasBatch: true,
      batchNumber: 'B-2026-04',
      mfgDate: '2026-01-10',
      expiryDate: '2028-01-10',
      godownId: `${companyId}_godown_1`,
      companyId
    },
    {
      id: `${companyId}_prod_2`,
      name: 'Braided Fast Charging Type-C Cable (1.5m)',
      sku: 'CAB-TYPC-15',
      barcode: '890103001002',
      brand: 'Portronics',
      category: 'Electronics',
      subcategory: 'Accessories',
      hsn: '8544',
      unit: 'pcs',
      buyingPrice: 120,
      sellingPrice: 299,
      gstPercent: 18,
      stock: 120,
      lowStockThreshold: 20,
      hasBatch: false,
      godownId: `${companyId}_godown_1`,
      companyId
    },
    {
      id: `${companyId}_prod_3`,
      name: 'Noise ColorFit Pulse 2 Smartwatch',
      sku: 'NOISE-PULSE-2',
      barcode: '890103001003',
      brand: 'Noise',
      category: 'Electronics',
      subcategory: 'Wearables',
      hsn: '8517',
      unit: 'pcs',
      buyingPrice: 1250,
      sellingPrice: 1999,
      gstPercent: 18,
      stock: 18,
      lowStockThreshold: 5,
      hasBatch: true,
      batchNumber: 'B-2026-08',
      mfgDate: '2026-02-15',
      expiryDate: '2029-02-15',
      godownId: `${companyId}_godown_2`,
      companyId
    },
    {
      id: `${companyId}_prod_4`,
      name: 'Royal Basmati Rice Classic (5 kg Bag)',
      sku: 'RICE-BASM-5KG',
      barcode: '890103001004',
      brand: 'India Gate',
      category: 'Groceries',
      subcategory: 'Food Grains',
      hsn: '1006',
      unit: 'pkt',
      buyingPrice: 420,
      sellingPrice: 580,
      gstPercent: 5,
      stock: 60,
      lowStockThreshold: 15,
      hasBatch: true,
      batchNumber: 'IG-9912',
      mfgDate: '2026-03-01',
      expiryDate: '2027-03-01',
      godownId: `${companyId}_godown_1`,
      companyId
    },
    {
      id: `${companyId}_prod_5`,
      name: 'Cold Pressed Extra Virgin Olive Oil (1 Ltr)',
      sku: 'OIL-OLV-1L',
      barcode: '890103001005',
      brand: 'Borges',
      category: 'Groceries',
      subcategory: 'Cooking Oils',
      hsn: '1509',
      unit: 'ltr',
      buyingPrice: 680,
      sellingPrice: 950,
      gstPercent: 12,
      stock: 25,
      lowStockThreshold: 8,
      hasBatch: true,
      batchNumber: 'BO-2026-11',
      mfgDate: '2026-01-20',
      expiryDate: '2027-07-20',
      godownId: `${companyId}_godown_1`,
      companyId
    },
    {
      id: `${companyId}_prod_6`,
      name: 'Organic Jumbo Roasted Cashews (500g)',
      sku: 'NUT-CASH-500G',
      barcode: '890103001006',
      brand: 'Nutraj',
      category: 'Groceries',
      subcategory: 'Dry Fruits',
      hsn: '0801',
      unit: 'pkt',
      buyingPrice: 380,
      sellingPrice: 550,
      gstPercent: 12,
      stock: 35,
      lowStockThreshold: 10,
      hasBatch: true,
      batchNumber: 'NT-8812',
      mfgDate: '2026-02-01',
      expiryDate: '2026-11-01',
      godownId: `${companyId}_godown_2`,
      companyId
    },
    {
      id: `${companyId}_prod_7`,
      name: 'Alcohol Hand Sanitizer Gel (500ml Dispenser)',
      sku: 'MED-SAN-500',
      barcode: '890103001007',
      brand: 'Dettol',
      category: 'Personal Care',
      subcategory: 'Hygiene',
      hsn: '3808',
      unit: 'pcs',
      buyingPrice: 110,
      sellingPrice: 199,
      gstPercent: 18,
      stock: 4, // Near low stock alert
      lowStockThreshold: 10,
      hasBatch: true,
      batchNumber: 'DT-552',
      mfgDate: '2025-05-10',
      expiryDate: '2026-09-15', // Near expiry
      godownId: `${companyId}_godown_2`,
      companyId
    },
    {
      id: `${companyId}_prod_8`,
      name: 'Natural Vitamin C 1000mg Effervescent (20 Tabs)',
      sku: 'VIT-C-EFFER-20',
      barcode: '890103001008',
      brand: 'Fast&Up',
      category: 'Personal Care',
      subcategory: 'Supplements',
      hsn: '2106',
      unit: 'pcs',
      buyingPrice: 210,
      sellingPrice: 350,
      gstPercent: 18,
      stock: 50,
      lowStockThreshold: 12,
      hasBatch: true,
      batchNumber: 'FU-2026-3',
      mfgDate: '2026-01-05',
      expiryDate: '2027-06-30',
      godownId: `${companyId}_godown_1`,
      companyId
    }
  ];
  products.forEach(p => {
    batch.set(doc(db, 'products', p.id), p);
  });

  // 4. Customers
  const customers = [
    {
      id: `${companyId}_cust_1`,
      name: 'Sharma Electronics & Mobile Care',
      phone: '+91 98202 11223',
      email: 'sharma.elec@gmail.com',
      address: 'Shop 4, Station Road, Dadar West, Mumbai',
      gstin: '27AABCS5544R1Z8',
      state: 'Maharashtra',
      category: 'Retailer',
      creditLimit: 50000,
      creditPeriodDays: 30,
      creditBalance: 12500, // Pending due
      totalSpent: 84500,
      companyId
    },
    {
      id: `${companyId}_cust_2`,
      name: 'Priya Supermarket & Provision Store',
      phone: '+91 98202 33445',
      email: 'priyastore.mum@yahoo.com',
      address: 'Near Gandhi Chowk, Thane West',
      gstin: '27AABCP8899K1Z2',
      state: 'Maharashtra',
      category: 'Wholesaler',
      creditLimit: 100000,
      creditPeriodDays: 45,
      creditBalance: 24800, // Pending due
      totalSpent: 165000,
      companyId
    },
    {
      id: `${companyId}_cust_3`,
      name: 'Aditya Infotech Solutions',
      phone: '+91 98202 55667',
      email: 'purchase@adityainfotech.in',
      address: 'Tech Hub Building, Vashi, Navi Mumbai',
      gstin: '27AAACA9911J1Z0',
      state: 'Maharashtra',
      category: 'Corporate',
      creditLimit: 75000,
      creditPeriodDays: 30,
      creditBalance: 0,
      totalSpent: 42000,
      companyId
    },
    {
      id: `${companyId}_cust_4`,
      name: 'Walk-in Retail Customers',
      phone: '+91 99999 00000',
      address: 'Counter Direct Checkout',
      state: 'Maharashtra',
      category: 'Retailer',
      creditLimit: 0,
      creditPeriodDays: 0,
      creditBalance: 0,
      totalSpent: 35000,
      companyId
    }
  ];
  customers.forEach(c => {
    batch.set(doc(db, 'customers', c.id), c);
  });

  // 5. Suppliers
  const suppliers = [
    {
      id: `${companyId}_supp_1`,
      name: 'Apex Wholesale Distribution India',
      phone: '+91 22 2884 9900',
      email: 'sales@apexwholesale.com',
      address: 'Bldg 5, APMC Market, Vashi, Navi Mumbai',
      gstin: '27AAACA1234D1Z4',
      state: 'Maharashtra',
      category: 'Distributor',
      creditLimit: 200000,
      creditBalance: 32000, // Payable balance
      totalPurchases: 280000,
      companyId
    },
    {
      id: `${companyId}_supp_2`,
      name: 'LogiTech Direct Import Corp',
      phone: '+91 22 6677 8899',
      email: 'b2b@logitechimport.in',
      address: 'SEZ Industrial Area, Surat, Gujarat',
      gstin: '24AABCL9900P1Z6',
      state: 'Gujarat', // Inter-state supplier
      category: 'Manufacturer',
      creditLimit: 300000,
      creditBalance: 45000, // Payable balance
      totalPurchases: 195000,
      companyId
    }
  ];
  suppliers.forEach(s => {
    batch.set(doc(db, 'suppliers', s.id), s);
  });

  // 6. Bank Accounts
  const bankAccounts = [
    {
      id: `${companyId}_bank_1`,
      accountName: 'Cash in Hand (Counter)',
      accountType: 'Cash Register',
      openingBalance: 15000,
      currentBalance: 28450,
      companyId
    },
    {
      id: `${companyId}_bank_2`,
      accountName: 'HDFC Bank Current A/C',
      accountType: 'Bank Account',
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088991122',
      ifscCode: 'HDFC0001042',
      openingBalance: 150000,
      currentBalance: 342800,
      companyId
    },
    {
      id: `${companyId}_bank_3`,
      accountName: 'Paytm Business QR Wallet',
      accountType: 'Digital Wallet',
      openingBalance: 5000,
      currentBalance: 14650,
      companyId
    }
  ];
  bankAccounts.forEach(b => {
    batch.set(doc(db, 'bank_accounts', b.id), b);
  });

  // 7. Sales Invoices
  const sales = [
    {
      id: `${companyId}_sale_1`,
      invoiceNumber: 'INV-2026-001',
      invoiceNo: 'INV-2026-001',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      customerId: `${companyId}_cust_1`,
      customerName: 'Sharma Electronics & Mobile Care',
      customerPhone: '+91 98202 11223',
      customerGSTIN: '27AABCS5544R1Z8',
      partyState: 'Maharashtra',
      isInterState: false,
      items: [
        { productId: `${companyId}_prod_1`, name: 'Logitech Wireless Mouse M220', sku: 'LOG-M220-BLK', price: 999, buyingPrice: 650, qty: 10, gstPercent: 18, total: 9990 },
        { productId: `${companyId}_prod_2`, name: 'Braided Fast Charging Type-C Cable', sku: 'CAB-TYPC-15', price: 299, buyingPrice: 120, qty: 20, gstPercent: 18, total: 5980 }
      ],
      subtotal: 15970,
      discountPercent: 5,
      discountAmount: 798.5,
      cgstTotal: 1157.06,
      sgstTotal: 1157.06,
      igstTotal: 0,
      totalTax: 2314.12,
      roundOff: -0.5,
      grandTotal: 15171,
      total: 15171,
      saleType: 'Due',
      source: 'Standard',
      cashier: 'Admin',
      companyId
    },
    {
      id: `${companyId}_sale_2`,
      invoiceNumber: 'POS-889101',
      invoiceNo: 'POS-889101',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      customerName: 'Priya Supermarket & Provision Store',
      customerPhone: '+91 98202 33445',
      items: [
        { productId: `${companyId}_prod_4`, name: 'Royal Basmati Rice Classic (5 kg)', sku: 'RICE-BASM-5KG', price: 580, buyingPrice: 420, qty: 15, gstPercent: 5, total: 8700 },
        { productId: `${companyId}_prod_5`, name: 'Cold Pressed Extra Virgin Olive Oil (1 Ltr)', sku: 'OIL-OLV-1L', price: 950, buyingPrice: 680, qty: 5, gstPercent: 12, total: 4750 }
      ],
      subtotal: 13450,
      discountPercent: 0,
      discountAmount: 0,
      cgstTotal: 462.5,
      sgstTotal: 462.5,
      totalTax: 925,
      roundOff: 0,
      grandTotal: 13450,
      total: 13450,
      saleType: 'UPI',
      source: 'POS',
      cashier: 'Staff Counter 1',
      companyId
    },
    {
      id: `${companyId}_sale_3`,
      invoiceNumber: 'POS-889102',
      invoiceNo: 'POS-889102',
      date: new Date(),
      customerName: 'Walk-in Retail Customer',
      customerPhone: '+91 98980 11223',
      items: [
        { productId: `${companyId}_prod_3`, name: 'Noise ColorFit Pulse 2 Smartwatch', sku: 'NOISE-PULSE-2', price: 1999, buyingPrice: 1250, qty: 1, gstPercent: 18, total: 1999 },
        { productId: `${companyId}_prod_6`, name: 'Organic Jumbo Roasted Cashews (500g)', sku: 'NUT-CASH-500G', price: 550, buyingPrice: 380, qty: 2, gstPercent: 12, total: 1100 }
      ],
      subtotal: 3099,
      discountPercent: 0,
      discountAmount: 0,
      totalTax: 423.05,
      roundOff: 1,
      grandTotal: 3100,
      total: 3100,
      saleType: 'Cash',
      source: 'POS',
      cashier: 'Staff Counter 1',
      companyId
    }
  ];
  sales.forEach(s => {
    batch.set(doc(db, 'sales', s.id), s);
  });

  // 8. Purchases
  const purchases = [
    {
      id: `${companyId}_pur_1`,
      billNumber: 'APX-BILL-902',
      supplierName: 'Apex Wholesale Distribution India',
      supplierGSTIN: '27AAACA1234D1Z4',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      items: [
        { name: 'Logitech Wireless Mouse M220', qty: 50, price: 650, buyingPrice: 650, total: 32500 },
        { name: 'Braided Fast Charging Type-C Cable', qty: 150, price: 120, buyingPrice: 120, total: 18000 }
      ],
      buyingPrice: 650,
      qty: 50,
      taxableTotal: 50500,
      grandTotal: 59590,
      paymentMode: 'Bank Transfer',
      companyId
    },
    {
      id: `${companyId}_pur_2`,
      billNumber: 'LOGI-SURAT-441',
      supplierName: 'LogiTech Direct Import Corp',
      supplierGSTIN: '24AABCL9900P1Z6',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      items: [
        { name: 'Noise ColorFit Pulse 2 Smartwatch', qty: 20, price: 1250, buyingPrice: 1250, total: 25000 }
      ],
      buyingPrice: 1250,
      qty: 20,
      taxableTotal: 25000,
      grandTotal: 29500,
      paymentMode: 'Credit',
      companyId
    }
  ];
  purchases.forEach(p => {
    batch.set(doc(db, 'purchases', p.id), p);
  });

  // 9. Expenses
  const expenses = [
    {
      id: `${companyId}_exp_1`,
      expenseNo: 'EXP-1001',
      title: 'Commercial Store Rent (Andheri East)',
      category: 'Rent & Utilities',
      amount: 35000,
      isItcEligible: true,
      vendorGSTIN: '27AAACR9988K1Z5',
      gstPercent: 18,
      paymentMode: 'Bank Transfer',
      date: '2026-08-01',
      companyId
    },
    {
      id: `${companyId}_exp_2`,
      expenseNo: 'EXP-1002',
      title: 'Monthly Electricity Bill (Adani Power)',
      category: 'Utilities',
      amount: 4850,
      isItcEligible: false,
      paymentMode: 'UPI',
      date: '2026-08-05',
      companyId
    },
    {
      id: `${companyId}_exp_3`,
      expenseNo: 'EXP-1003',
      title: 'Logistics & Inter-Godown Delivery Tempo',
      category: 'Logistics',
      amount: 2200,
      isItcEligible: true,
      vendorGSTIN: '27AABCL3322M1Z1',
      gstPercent: 5,
      paymentMode: 'Cash',
      date: '2026-08-12',
      companyId
    }
  ];
  expenses.forEach(e => {
    batch.set(doc(db, 'expenses', e.id), e);
  });

  // 10. Delivery Challans
  const challans = [
    {
      id: `${companyId}_chal_1`,
      challanNo: 'DC-2026-01',
      customerName: 'Sharma Electronics & Mobile Care',
      customerPhone: '+91 98202 11223',
      deliveryAddress: 'Shop 4, Station Road, Dadar West, Mumbai',
      vehicleNo: 'MH-02-EE-4491',
      driverName: 'Ramesh Yadav',
      items: [
        { productId: `${companyId}_prod_1`, name: 'Logitech Wireless Mouse M220', qty: 10, unit: 'pcs' },
        { productId: `${companyId}_prod_2`, name: 'Braided Fast Charging Type-C Cable', qty: 20, unit: 'pcs' }
      ],
      status: 'Delivered',
      date: '2026-08-20',
      companyId
    }
  ];
  challans.forEach(ch => {
    batch.set(doc(db, 'challans', ch.id), ch);
  });

  // 11. Returns & Notes
  const returnsNotes = [
    {
      id: `${companyId}_ret_1`,
      noteNo: 'CN-2026-01',
      noteType: 'credit',
      originalDocNo: 'INV-2026-001',
      partyName: 'Sharma Electronics & Mobile Care',
      reason: '1 unit damaged in transit',
      items: [
        { productId: `${companyId}_prod_2`, name: 'Braided Fast Charging Type-C Cable', qty: 1, price: 299, total: 299 }
      ],
      refundType: 'Credit to Account',
      totalAmount: 299,
      date: '2026-08-22',
      companyId
    }
  ];
  returnsNotes.forEach(r => {
    batch.set(doc(db, 'returns_notes', r.id), r);
  });

  // 12. Stock Adjustments
  const adjustments = [
    {
      id: `${companyId}_adj_1`,
      productId: `${companyId}_prod_7`,
      productName: 'Alcohol Hand Sanitizer Gel (500ml)',
      type: 'Decrease',
      adjustmentQty: 2,
      stockBefore: 6,
      stockAfter: 4,
      reason: 'Damaged / Broken Bottle Seal',
      adjustedBy: 'Warehouse Team',
      date: '2026-08-15',
      companyId
    }
  ];
  adjustments.forEach(a => {
    batch.set(doc(db, 'stock_adjustments', a.id), a);
  });

  // 13. Promotions & Coupons
  const promotions = [
    {
      id: `${companyId}_promo_1`,
      code: 'FESTIVE10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 500,
      expiryDate: '2026-12-31',
      isActive: true,
      companyId
    },
    {
      id: `${companyId}_promo_2`,
      code: 'FLAT200',
      discountType: 'flat',
      discountValue: 200,
      minOrderValue: 1500,
      expiryDate: '2026-11-30',
      isActive: true,
      companyId
    }
  ];
  promotions.forEach(pr => {
    batch.set(doc(db, 'promotions', pr.id), pr);
  });

  // 14. Online Web Shop Orders
  const onlineOrders = [
    {
      id: `${companyId}_ord_1`,
      orderNo: 'WEB-99120',
      customerName: 'Ananya Deshmukh',
      customerPhone: '+91 98330 44556',
      deliveryAddress: 'Flat 402, Green Acres, Powai, Mumbai',
      items: [
        { productId: `${companyId}_prod_3`, name: 'Noise ColorFit Pulse 2 Smartwatch', price: 1999, qty: 1, total: 1999 },
        { productId: `${companyId}_prod_2`, name: 'Braided Fast Charging Type-C Cable', price: 299, qty: 1, total: 299 }
      ],
      totalAmount: 2298,
      status: 'Accepted',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      companyId
    },
    {
      id: `${companyId}_ord_2`,
      orderNo: 'WEB-99121',
      customerName: 'Vikram Joshi',
      customerPhone: '+91 98110 77889',
      deliveryAddress: 'Bungalow 7, JVPD Scheme, Juhu, Mumbai',
      items: [
        { productId: `${companyId}_prod_4`, name: 'Royal Basmati Rice Classic (5 kg)', price: 580, qty: 2, total: 1160 },
        { productId: `${companyId}_prod_5`, name: 'Cold Pressed Extra Virgin Olive Oil', price: 950, qty: 1, total: 950 }
      ],
      totalAmount: 2110,
      status: 'Pending',
      createdAt: new Date(),
      companyId
    }
  ];
  onlineOrders.forEach(o => {
    batch.set(doc(db, 'online_orders', o.id), o);
  });

  // Commit all writes
  await batch.commit();
  return true;
};
