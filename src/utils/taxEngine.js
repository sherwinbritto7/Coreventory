// Indian States with GST State Codes
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

/**
 * Determine if transaction is Intra-State or Inter-State
 */
export const getTaxType = (companyState = '', partyState = '') => {
  if (!companyState || !partyState) return 'INTRA'; // Default intra-state
  const cState = companyState.trim().toLowerCase();
  const pState = partyState.trim().toLowerCase();
  return cState === pState ? 'INTRA' : 'INTER';
};

/**
 * Extract 2-digit state code from GSTIN
 */
export const getStateCodeFromGSTIN = (gstin = '') => {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
};

/**
 * Compute Tax Breakdown (CGST, SGST, IGST) for an item
 */
export const calculateItemTaxes = ({ taxableAmount, gstPercent = 18, isInterState = false }) => {
  const rate = parseFloat(gstPercent) || 0;
  const taxAmount = (taxableAmount * rate) / 100;
  
  if (isInterState) {
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: rate,
      igstAmount: taxAmount,
      totalTax: taxAmount,
      totalAmount: taxableAmount + taxAmount
    };
  } else {
    const halfRate = rate / 2;
    const halfTax = taxAmount / 2;
    return {
      cgstRate: halfRate,
      cgstAmount: halfTax,
      sgstRate: halfRate,
      sgstAmount: halfTax,
      igstRate: 0,
      igstAmount: 0,
      totalTax: taxAmount,
      totalAmount: taxableAmount + taxAmount
    };
  }
};

/**
 * Generate standard UPI Payment Intent URL
 */
export const generateUPIString = ({ upiId, payeeName, amount, invoiceNo = '', note = '' }) => {
  if (!upiId) return '';
  const cleanUPI = encodeURIComponent(upiId.trim());
  const cleanName = encodeURIComponent(payeeName || 'Store');
  const cleanNote = encodeURIComponent(note || `Payment for Inv ${invoiceNo}`);
  const amt = parseFloat(amount || 0).toFixed(2);
  
  return `upi://pay?pa=${cleanUPI}&pn=${cleanName}&am=${amt}&tn=${cleanNote}&cu=INR`;
};

/**
 * Generate Mock E-Invoice IRN Hash & Signed QR string
 */
export const generateMockEInvoiceIRN = (invoiceNo, companyGSTIN, dateStr) => {
  const seed = `${companyGSTIN}-${invoiceNo}-${dateStr}-${Date.now()}`;
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += ((seed.charCodeAt(i % seed.length) * 17 + i * 31) % 16).toString(16);
  }
  return {
    irn: hash.toUpperCase(),
    ackNo: '11' + Math.floor(1000000000 + Math.random() * 9000000000),
    ackDate: new Date().toISOString(),
    signedQR: `https://einvoice1.gst.gov.in/qr?irn=${hash.toUpperCase()}&gstin=${companyGSTIN}&inv=${invoiceNo}`
  };
};

/**
 * Generate E-Way Bill JSON Payload compliant with NIC Portal
 */
export const buildEWayBillJSON = ({ invoice, company, party, transporter = {} }) => {
  const items = (invoice.items || []).map((item, idx) => ({
    itemNo: idx + 1,
    productName: item.name || item.productName,
    productDesc: item.description || item.name,
    hsnCode: item.hsn || item.sku || '9988',
    quantity: parseFloat(item.quantity) || 1,
    qtyUnit: item.unit || 'PCS',
    taxableAmount: parseFloat(item.taxableAmount || (item.sellingPrice * item.quantity)) || 0,
    cgstRate: item.cgstRate || 9,
    sgstRate: item.sgstRate || 9,
    igstRate: item.igstRate || 0,
    cessRate: 0
  }));

  return {
    version: "1.0.0",
    billLists: [{
      userGstin: company.gstin || "URP",
      supplyType: "O", // Outward
      subSupplyType: "1", // Supply
      docType: "INV",
      docNo: invoice.invoiceNo || `INV-${Date.now()}`,
      docDate: invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      fromGstin: company.gstin || "URP",
      fromTrdName: company.companyName || "Coreventory Business",
      fromAddr1: company.address || "",
      fromPlace: company.city || "",
      fromPincode: parseInt(company.pincode) || 400001,
      fromStateCode: parseInt(getStateCodeFromGSTIN(company.gstin) || 27),
      toGstin: party.gstin || "URP",
      toTrdName: party.name || invoice.customerName || "Customer",
      toAddr1: party.address || "",
      toPlace: party.city || "",
      toPincode: parseInt(party.pincode) || 400001,
      toStateCode: parseInt(getStateCodeFromGSTIN(party.gstin) || 27),
      totalValue: parseFloat(invoice.taxableTotal || invoice.subtotal || 0),
      cgstValue: parseFloat(invoice.cgstTotal || 0),
      sgstValue: parseFloat(invoice.sgstTotal || 0),
      igstValue: parseFloat(invoice.igstTotal || 0),
      cessValue: 0,
      totInvValue: parseFloat(invoice.grandTotal || invoice.total || 0),
      transporterId: transporter.id || "",
      transporterName: transporter.name || "Self Logistics",
      transDocNo: transporter.docNo || `LR-${Date.now()}`,
      transMode: transporter.mode || "1", // 1: Road, 2: Rail, 3: Air, 4: Ship
      distance: parseInt(transporter.distance) || 50,
      transDocDate: new Date().toLocaleDateString('en-GB'),
      vehicleNo: transporter.vehicleNo || "MH04AB1234",
      vehicleType: "R",
      itemList: items
    }]
  };
};

/**
 * GSTR-1 Aggregator: aggregates sales invoices into B2B, B2CL, B2CS, CDNR, and HSN tables
 */
export const aggregateGSTR1 = (salesList = [], creditNotes = [], companyState = '') => {
  const b2b = [];
  const b2cl = []; // Inter-state > 2.5 Lakhs to unregistered
  const b2cs = []; // Rest unregistered
  const hsnMap = {};
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalInvoiceVal = 0;

  salesList.forEach(sale => {
    const isInter = sale.isInterState || (sale.partyState && companyState && sale.partyState.toLowerCase() !== companyState.toLowerCase());
    const isRegistered = Boolean(sale.customerGSTIN && sale.customerGSTIN.trim().length >= 15);
    const invoiceVal = parseFloat(sale.grandTotal || sale.total || 0);
    const taxableVal = parseFloat(sale.taxableTotal || sale.subtotal || (invoiceVal * 0.82));
    const cgstVal = isInter ? 0 : parseFloat(sale.cgstTotal || ((invoiceVal - taxableVal) / 2));
    const sgstVal = isInter ? 0 : parseFloat(sale.sgstTotal || ((invoiceVal - taxableVal) / 2));
    const igstVal = isInter ? parseFloat(sale.igstTotal || (invoiceVal - taxableVal)) : 0;

    totalTaxable += taxableVal;
    totalCGST += cgstVal;
    totalSGST += sgstVal;
    totalIGST += igstVal;
    totalInvoiceVal += invoiceVal;

    const row = {
      invoiceNo: sale.invoiceNo || `INV-${sale.id?.slice(0, 6)}`,
      date: sale.date ? new Date(sale.date).toLocaleDateString('en-GB') : '',
      customerName: sale.customerName || 'Customer',
      gstin: sale.customerGSTIN || 'URP',
      placeOfSupply: sale.partyState || companyState || 'State',
      reverseCharge: sale.reverseCharge ? 'Y' : 'N',
      invoiceValue: invoiceVal,
      taxableValue: taxableVal,
      cgst: cgstVal,
      sgst: sgstVal,
      igst: igstVal,
      rate: sale.items?.[0]?.gstPercent || 18
    };

    if (isRegistered) {
      b2b.push(row);
    } else if (isInter && invoiceVal > 250000) {
      b2cl.push(row);
    } else {
      b2cs.push(row);
    }

    // HSN aggregation
    (sale.items || []).forEach(item => {
      const hsn = item.hsn || item.sku || '9988';
      const qty = parseFloat(item.quantity) || 1;
      const tVal = parseFloat(item.taxableAmount || (item.sellingPrice * qty)) || 0;
      const rate = parseFloat(item.gstPercent) || 18;
      const tax = (tVal * rate) / 100;

      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsn,
          desc: item.name || item.productName || 'Goods',
          unit: item.unit || 'PCS',
          totalQty: 0,
          totalValue: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          rate
        };
      }
      hsnMap[hsn].totalQty += qty;
      hsnMap[hsn].taxableValue += tVal;
      hsnMap[hsn].totalValue += (tVal + tax);
      if (isInter) {
        hsnMap[hsn].igst += tax;
      } else {
        hsnMap[hsn].cgst += tax / 2;
        hsnMap[hsn].sgst += tax / 2;
      }
    });
  });

  const cdnr = (creditNotes || []).map(cn => ({
    noteNo: cn.noteNo || `CN-${cn.id?.slice(0, 6)}`,
    originalInvNo: cn.originalInvoiceNo || '',
    noteDate: cn.date ? new Date(cn.date).toLocaleDateString('en-GB') : '',
    customerName: cn.customerName || 'Customer',
    gstin: cn.customerGSTIN || 'URP',
    noteValue: parseFloat(cn.amount || 0),
    taxableValue: parseFloat(cn.taxableAmount || (cn.amount * 0.82) || 0),
    cgst: parseFloat(cn.cgst || 0),
    sgst: parseFloat(cn.sgst || 0),
    igst: parseFloat(cn.igst || 0),
    reason: cn.reason || 'Sales Return'
  }));

  return {
    summary: {
      totalTaxable,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax: totalCGST + totalSGST + totalIGST,
      totalInvoiceVal
    },
    b2b,
    b2cl,
    b2cs,
    cdnr,
    hsn: Object.values(hsnMap)
  };
};

/**
 * GSTR-3B Aggregator: monthly Outward Liability vs Inward ITC Claim
 */
export const aggregateGSTR3B = (salesList = [], purchasesList = [], expensesList = [], companyState = '') => {
  let outwardTaxable = 0, outwardCGST = 0, outwardSGST = 0, outwardIGST = 0;
  let itcTaxable = 0, itcCGST = 0, itcSGST = 0, itcIGST = 0;

  salesList.forEach(sale => {
    const isInter = sale.isInterState || (sale.partyState && companyState && sale.partyState.toLowerCase() !== companyState.toLowerCase());
    const invoiceVal = parseFloat(sale.grandTotal || sale.total || 0);
    const taxableVal = parseFloat(sale.taxableTotal || sale.subtotal || (invoiceVal * 0.82));
    const taxVal = invoiceVal - taxableVal;
    
    outwardTaxable += taxableVal;
    if (isInter) {
      outwardIGST += taxVal;
    } else {
      outwardCGST += taxVal / 2;
      outwardSGST += taxVal / 2;
    }
  });

  // Purchases ITC
  purchasesList.forEach(pur => {
    const isInter = pur.isInterState || false;
    const billVal = parseFloat(pur.grandTotal || pur.total || pur.amount || 0);
    const taxableVal = parseFloat(pur.taxableTotal || (billVal * 0.82));
    const taxVal = billVal - taxableVal;

    itcTaxable += taxableVal;
    if (isInter) {
      itcIGST += taxVal;
    } else {
      itcCGST += taxVal / 2;
      itcSGST += taxVal / 2;
    }
  });

  // Eligible Expense ITC
  expensesList.forEach(exp => {
    if (exp.isItcEligible) {
      const expVal = parseFloat(exp.amount || 0);
      const rate = parseFloat(exp.gstPercent || 18);
      const taxVal = (expVal * rate) / (100 + rate);
      const taxableVal = expVal - taxVal;

      itcTaxable += taxableVal;
      itcCGST += taxVal / 2;
      itcSGST += taxVal / 2;
    }
  });

  return {
    outward: {
      desc: "3.1 (a) Outward Taxable Supplies",
      taxable: outwardTaxable,
      cgst: outwardCGST,
      sgst: outwardSGST,
      igst: outwardIGST,
      totalTax: outwardCGST + outwardSGST + outwardIGST
    },
    itc: {
      desc: "4. (A) Eligible Input Tax Credit (All other ITC)",
      taxable: itcTaxable,
      cgst: itcCGST,
      sgst: itcSGST,
      igst: itcIGST,
      totalTax: itcCGST + itcSGST + itcIGST
    },
    netPayable: {
      cgst: Math.max(0, outwardCGST - itcCGST),
      sgst: Math.max(0, outwardSGST - itcSGST),
      igst: Math.max(0, outwardIGST - itcIGST),
      total: Math.max(0, (outwardCGST + outwardSGST + outwardIGST) - (itcCGST + itcSGST + itcIGST))
    }
  };
};
