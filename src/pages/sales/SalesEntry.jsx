import React, { useState, useEffect, useRef } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  increment,
  query,
  onSnapshot,
  writeBatch,
  where,
} from "firebase/firestore";
import {
  Plus,
  Trash2,
  User,
  Phone,
  FileText,
  Loader2,
  CheckCircle,
  ChevronLeft,
  Calendar,
  Save,
  Download,
  Eye,
  Package,
  Share2,
} from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";
import Modal from "../../components/ui/Modal";
import { INDIAN_STATES } from "../../utils/taxEngine";

const SalesEntry = () => {
  const { user, companyId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saleType, setSaleType] = useState("Cash"); // Cash or Credit
  const [paymentMode, setPaymentMode] = useState("Cash");
  const customerRef = useRef(null);
  const invoicePreviewRef = useRef(null);
  const tableRef = useRef(null);
  const [activeProductDropdown, setActiveProductDropdown] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setShowCustSuggestions(false);
      }
      if (tableRef.current && !tableRef.current.contains(event.target)) {
        setActiveProductDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sale & Customer Details
  const [customer, setCustomer] = useState({
    id: "",
    name: "",
    phone: "",
    address: "",
    gstin: "",
    state: "Maharashtra",
  });

  const [invoiceDetails, setInvoiceDetails] = useState({
    number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    notes: "1. Goods once sold will not be returned.\n2. Subject to local jurisdiction.",
  });

  // Table Data
  const [items, setItems] = useState([
    {
      id: Date.now(),
      name: "",
      sku: "",
      hsn: "",
      productId: "",
      qty: 1,
      unit: "pcs",
      price: 0,
      discount: 0,
      tax: 18,
      total: 0,
      showSearch: false,
    },
  ]);

  // Master Data
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedSaleBatch, setSavedSaleBatch] = useState(null);

  const [businessInfo, setBusinessInfo] = useState({
    name: "Coreventory Store",
    address: "Commercial Hub, Mumbai - 400001",
    gstin: "27AABCA1234F1Z5",
    state: "Maharashtra",
    phone: "+91 98201 23456",
    email: "billing@coreventory.com",
    upiId: "merchant@upi",
    logoURL: "",
    terms: "1. Goods once sold will not be returned.\n2. Subject to local jurisdiction.",
  });

  useEffect(() => {
    if (!companyId) return;

    // Fetch Business Profile
    const fetchBusinessProfile = async () => {
      try {
        const compSnap = await getDoc(doc(db, "companies", companyId));
        if (compSnap.exists()) {
          const data = compSnap.data();
          setBusinessInfo({
            name: data.companyName || data.businessName || "Coreventory Store",
            address: data.address || "",
            gstin: data.gstin || "",
            state: data.state || "Maharashtra",
            phone: data.phone || "",
            email: data.email || "",
            upiId: data.upiId || "",
            logoURL: data.logoURL || "",
            terms: data.terms || "1. Goods once sold will not be returned.",
          });
        }
      } catch (error) {
        console.error("Error fetching business profile:", error);
      }
    };

    fetchBusinessProfile();

    // Fetch Products
    const qProd = query(
      collection(db, "products"),
      where("companyId", "==", companyId)
    );
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setAllProducts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    // Fetch Customers
    const qCust = query(
      collection(db, "customers"),
      where("companyId", "==", companyId)
    );
    const unsubCust = onSnapshot(qCust, (snapshot) => {
      setAllCustomers(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => {
      unsubProd();
      unsubCust();
    };
  }, [companyId]);

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    const discount = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0;

    const amount = qty * price;
    const discountAmount = amount * (discount / 100);
    const taxableAmount = amount - discountAmount;
    const taxAmount = taxableAmount * (tax / 100);
    return taxableAmount + taxAmount;
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    const unitPrice = parseFloat(product.sellingPrice ?? product.price ?? 0);
    const gstRate = parseFloat(product.gstPercent ?? product.gst ?? product.tax ?? 18);
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      name: product.name,
      sku: product.sku || "",
      hsn: product.hsn || "",
      price: unitPrice,
      tax: gstRate,
      unit: product.unit || "pcs",
      qty: newItems[index].qty || 1,
      discount: newItems[index].discount || 0,
      stock: product.stock || 0,
      showSearch: false,
    };
    newItems[index].total = calculateItemTotal(newItems[index]);
    setItems(newItems);
    setActiveProductDropdown(null);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: "",
        sku: "",
        hsn: "",
        productId: "",
        qty: 1,
        unit: "pcs",
        price: 0,
        discount: 0,
        tax: 18,
        total: 0,
        showSearch: false,
      },
    ]);
  };

  const removeRow = (index) => {
    if (items.length <= 1) {
      setItems([
        {
          id: Date.now(),
          name: "",
          sku: "",
          hsn: "",
          productId: "",
          qty: 1,
          unit: "pcs",
          price: 0,
          discount: 0,
          tax: 18,
          total: 0,
          showSearch: false,
        },
      ]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const taxableAmount = items.reduce((acc, i) => {
    const qty = parseFloat(i.qty) || 0;
    const price = parseFloat(i.price) || 0;
    const discount = parseFloat(i.discount) || 0;
    const amt = qty * price;
    return acc + (amt - (amt * discount) / 100);
  }, 0);

  const totalDiscount = items.reduce((acc, i) => {
    const qty = parseFloat(i.qty) || 0;
    const price = parseFloat(i.price) || 0;
    const discount = parseFloat(i.discount) || 0;
    return acc + ((qty * price * discount) / 100);
  }, 0);

  const totalTax = items.reduce((acc, i) => {
    const qty = parseFloat(i.qty) || 0;
    const price = parseFloat(i.price) || 0;
    const discount = parseFloat(i.discount) || 0;
    const tax = parseFloat(i.tax) || 0;
    const amt = qty * price;
    const taxable = amt - (amt * discount) / 100;
    return acc + (taxable * tax) / 100;
  }, 0);

  const rawGrandTotal = taxableAmount + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = (grandTotal - rawGrandTotal).toFixed(2);

  const isInterState = customer.state && businessInfo.state && customer.state !== businessInfo.state;
  const cgstAmount = isInterState ? 0 : totalTax / 2;
  const sgstAmount = isInterState ? 0 : totalTax / 2;
  const igstAmount = isInterState ? totalTax : 0;

  const handleSubmit = async () => {
    if (items.some((item) => !item.name.trim() || parseFloat(item.qty) <= 0)) {
      toast.error("Please add at least one item with valid quantity");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Check for Invoice No. Uniqueness
      const invCheck = query(
        collection(db, "sales"),
        where("invoiceNumber", "==", invoiceDetails.number),
        where("companyId", "==", companyId)
      );
      const invSnap = await getDocs(invCheck);

      let finalInvoiceNumber = invoiceDetails.number;
      if (!invSnap.empty) {
        finalInvoiceNumber = `${invoiceDetails.number}-${Math.floor(Math.random() * 1000)}`;
      }

      // Prepare Line Items
      const sanitizedItems = items.map((item) => ({
        name: item.name,
        sku: item.sku || "",
        hsn: item.hsn || "",
        productId: item.productId || null,
        qty: parseFloat(item.qty) || 0,
        unit: item.unit || "pcs",
        price: parseFloat(item.price) || 0,
        discount: parseFloat(item.discount) || 0,
        tax: parseFloat(item.tax) || 0,
        gstPercent: parseFloat(item.tax) || 0,
        total: calculateItemTotal(item),
      }));

      // Check stock availability
      for (const item of sanitizedItems) {
        if (item.productId) {
          const product = allProducts.find((p) => p.id === item.productId);
          if (product && product.stock < item.qty) {
            toast.error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
            setLoading(false);
            return;
          }
        }
      }

      const saleData = {
        customerName: customer.name || "Walk-in Customer",
        customerId: customer.id || null,
        customerPhone: customer.phone || "",
        customerAddress: customer.address || "",
        customerGSTIN: customer.gstin || "",
        partyState: customer.state || businessInfo.state || "Maharashtra",
        isInterState,
        invoiceNumber: finalInvoiceNumber,
        invoiceNo: finalInvoiceNumber,
        date: new Date(invoiceDetails.date),
        dueDate: new Date(invoiceDetails.dueDate),
        items: sanitizedItems,
        taxableAmount,
        subtotal: taxableAmount,
        discountAmount: totalDiscount,
        totalTax,
        cgstTotal: cgstAmount,
        sgstTotal: sgstAmount,
        igstTotal: igstAmount,
        roundOff: parseFloat(roundOff),
        grandTotal,
        total: grandTotal,
        saleType,
        paymentMode: saleType === "Cash" ? paymentMode : "Credit",
        paymentStatus: saleType === "Cash" ? "Paid" : "Unpaid",
        cashAmount: saleType === "Cash" ? grandTotal : 0,
        creditAmount: saleType === "Credit" ? grandTotal : 0,
        notes: invoiceDetails.notes,
        source: "Standard",
        status: "completed",
        createdBy: user?.uid || "system",
        cashier: user?.displayName || "Admin",
        companyId,
        createdAt: new Date(),
      };

      // Customer Directory Management
      if (customer.name && customer.phone) {
        const customerCheck = query(
          collection(db, "customers"),
          where("phone", "==", customer.phone),
          where("companyId", "==", companyId)
        );
        const customerSnap = await getDocs(customerCheck);

        if (customerSnap.empty) {
          const newCustomerRef = doc(collection(db, "customers"));
          batch.set(newCustomerRef, {
            name: customer.name,
            phone: customer.phone,
            address: customer.address || "",
            gstin: customer.gstin || "",
            state: customer.state || "Maharashtra",
            companyId,
            createdAt: new Date(),
            totalSpent: grandTotal,
            creditBalance: saleType === "Credit" ? grandTotal : 0,
            lastVisit: new Date(),
          });
        } else {
          const customerDoc = customerSnap.docs[0];
          batch.update(customerDoc.ref, {
            totalSpent: increment(grandTotal),
            creditBalance: saleType === "Credit" ? increment(grandTotal) : increment(0),
            lastVisit: new Date(),
            address: customer.address || customerDoc.data().address || "",
            gstin: customer.gstin || customerDoc.data().gstin || "",
            state: customer.state || customerDoc.data().state || "Maharashtra",
          });
        }
      }

      // Add Sale Document
      const saleRef = doc(collection(db, "sales"));
      batch.set(saleRef, saleData);

      // Decrement Inventory Stock
      sanitizedItems.forEach((item) => {
        if (item.productId) {
          const productRef = doc(db, "products", item.productId);
          batch.update(productRef, {
            stock: increment(-item.qty),
          });
        }
      });

      await batch.commit();

      const savedSale = {
        ...saleData,
        id: saleRef.id,
        date: { seconds: Math.floor(new Date(invoiceDetails.date).getTime() / 1000) },
      };

      setSavedSaleBatch(savedSale);
      setShowSuccessModal(true);
      toast.success("Sales Invoice Created & Inventory Updated");
    } catch (error) {
      console.error("Sale Save Error:", error);
      toast.error(`Invoice Creation Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5 pb-24">
      {/* Sleek Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/sales")}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Back to Sales"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                New Sales Invoice
              </h1>
              <span className="badge badge-neutral">GST Tax Invoice</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Issue a standard GST compliant sales invoice and auto-deduct inventory
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cash / Credit Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setSaleType("Cash");
                if (paymentMode === "Credit") setPaymentMode("Cash");
              }}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium transition-colors",
                saleType === "Cash"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
              )}
            >
              Cash (Paid)
            </button>
            <button
              type="button"
              onClick={() => {
                setSaleType("Credit");
                setPaymentMode("Credit");
              }}
              className={cn(
                "px-3 py-1.5 rounded-md font-medium transition-colors",
                saleType === "Credit"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-700"
              )}
            >
              Credit (Due)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="btn-secondary"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & Issue</span>
          </button>
        </div>
      </div>

      {/* Top Details Section: Customer & Invoice Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Customer Information (7 Columns) */}
        <div className="lg:col-span-7 card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Customer Details
              </h2>
            </div>
            {customer.id && (
              <span className="badge badge-success text-[10px]">Existing CRM Party</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Search / Name */}
            <div className="relative" ref={customerRef}>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Type customer or business name..."
                className="input-field"
                value={customer.name}
                onChange={(e) => {
                  setCustomer({ ...customer, name: e.target.value });
                  setShowCustSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => customer.name && setShowCustSuggestions(true)}
              />

              {/* Suggestions Dropdown */}
              {showCustSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                  {allCustomers.filter(
                    (c) =>
                      c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
                      (c.phone && c.phone.includes(customer.name))
                  ).length > 0 ? (
                    allCustomers
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
                          (c.phone && c.phone.includes(customer.name))
                      )
                      .map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between text-xs"
                          onClick={() => {
                            setCustomer({
                              id: cust.id,
                              name: cust.name,
                              phone: cust.phone || "",
                              address: cust.address || "",
                              gstin: cust.gstin || "",
                              state: cust.state || "Maharashtra",
                            });
                            setShowCustSuggestions(false);
                          }}
                        >
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-zinc-200">{cust.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500">{cust.phone || "No phone"}</p>
                          </div>
                          {cust.gstin && (
                            <span className="badge badge-neutral text-[9px] font-mono">{cust.gstin}</span>
                          )}
                        </button>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">
                      New customer will be saved to CRM
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Phone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  className="input-field pl-8"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer GSTIN */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Customer GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="27AABCS1234R1Z8"
                className="input-field font-mono uppercase"
                value={customer.gstin}
                onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })}
              />
            </div>

            {/* State of Supply */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Place of Supply
              </label>
              <select
                className="input-field"
                value={customer.state}
                onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.code}) {s.name === businessInfo.state ? "(Intra-State)" : "(Inter-State IGST)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
              Billing & Shipping Address
            </label>
            <input
              type="text"
              placeholder="Shop/Flat No., Street, Area, City, Pincode"
              className="input-field"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
            />
          </div>
        </div>

        {/* Document Metadata (5 Columns) */}
        <div className="lg:col-span-5 card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Invoice Details
              </h2>
            </div>
            <span className={cn("badge font-mono", isInterState ? "badge-warning" : "badge-neutral")}>
              {isInterState ? "IGST Supply" : "CGST + SGST Supply"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Invoice Number */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                className="input-field font-mono font-semibold"
                value={invoiceDetails.number}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, number: e.target.value })}
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                className="input-field"
                value={invoiceDetails.date}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Payment Mode
              </label>
              <select
                className="input-field"
                value={saleType === "Credit" ? "Credit" : paymentMode}
                disabled={saleType === "Credit"}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit (Due)</option>
              </select>
            </div>

            {/* Payment Due Date */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Payment Due Date
              </label>
              <input
                type="date"
                className="input-field"
                value={invoiceDetails.dueDate}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Quick Bank Summary Banner */}
          <div className="p-2.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Payee VPA:</span>
              <strong className="font-mono text-slate-800 dark:text-zinc-200">{businessInfo.upiId || "Not configured"}</strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Billed By:</span>
              <span className="text-slate-800 dark:text-zinc-200">{businessInfo.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table Card */}
      <div ref={tableRef} className="card p-0 overflow-visible relative z-20">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Line Items & Billing Items
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {items.length} {items.length === 1 ? "item" : "items"} &middot; Total Units:{" "}
            <strong className="text-slate-800 dark:text-zinc-200">
              {items.reduce((acc, i) => acc + (parseFloat(i.qty) || 0), 0)}
            </strong>
          </span>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center font-semibold">#</th>
                <th className="px-3 py-2.5 font-semibold min-w-[240px]">Product / Item Description</th>
                <th className="w-24 px-2 py-2.5 text-center font-semibold">Qty</th>
                <th className="w-20 px-2 py-2.5 text-center font-semibold">Unit</th>
                <th className="w-28 px-2 py-2.5 text-right font-semibold">Rate (₹)</th>
                <th className="w-20 px-2 py-2.5 text-center font-semibold">Disc %</th>
                <th className="w-24 px-2 py-2.5 text-center font-semibold">GST %</th>
                <th className="w-32 px-3 py-2.5 text-right font-semibold">Amount (₹)</th>
                <th className="w-10 px-2 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/30 transition-colors">
                  {/* Row Number */}
                  <td className="px-3 py-2.5 text-center text-slate-400 font-medium">
                    {index + 1}
                  </td>

                  {/* Product Search & Dropdown */}
                  <td className="px-3 py-2.5 relative">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Type product name, SKU, or scan barcode..."
                        className={cn(
                          "input-field font-medium",
                          item.productId && "border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/20 dark:bg-emerald-950/10"
                        )}
                        value={item.name}
                        onChange={(e) => {
                          updateItem(index, "name", e.target.value);
                          setActiveProductDropdown(index);
                        }}
                        onFocus={() => setActiveProductDropdown(index)}
                      />
                      {item.productId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="font-mono">Linked: {item.sku ? `SKU ${item.sku}` : "Catalog Item"}</span>
                          {item.hsn && <span className="text-slate-400 dark:text-zinc-500">&middot; HSN: {item.hsn}</span>}
                        </div>
                      )}
                    </div>

                    {/* Product Suggestion Dropdown */}
                    {activeProductDropdown === index && (
                      <div className="absolute top-full left-3 w-[380px] sm:w-[460px] max-w-[90vw] mt-1.5 bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-[999] max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
                        {(() => {
                          const queryText = (item.name || "").trim().toLowerCase();
                          const filtered = allProducts.filter((p) => {
                            if (!queryText) return true;
                            const matchName = p.name?.toLowerCase().includes(queryText);
                            const matchSku = p.sku?.toLowerCase().includes(queryText);
                            const matchBarcode = p.barcode?.includes(queryText);
                            const matchHsn = p.hsn?.toLowerCase().includes(queryText);
                            const matchCategory = p.category?.toLowerCase().includes(queryText);
                            return matchName || matchSku || matchBarcode || matchHsn || matchCategory;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-3 text-xs text-slate-500 dark:text-zinc-400 text-center">
                                <p className="font-medium text-slate-700 dark:text-zinc-300">No catalog match found</p>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                  Custom line item (manual rate & tax)
                                </p>
                              </div>
                            );
                          }

                          return filtered.slice(0, 20).map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              className="w-full px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/70 transition-colors flex items-center justify-between text-xs group"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectProduct(index, prod);
                              }}
                            >
                              <div className="space-y-0.5 max-w-[65%]">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                    {prod.name}
                                  </p>
                                  {prod.category && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded">
                                      {prod.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-2">
                                  <span>SKU: {prod.sku || "N/A"}</span>
                                  {prod.hsn && <span>HSN: {prod.hsn}</span>}
                                </p>
                              </div>
                              <div className="text-right space-y-0.5">
                                <p className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                  {formatCurrency(prod.sellingPrice || prod.price || 0)}
                                </p>
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                    {prod.gstPercent ?? prod.gst ?? 18}% GST
                                  </span>
                                  <span
                                    className={cn(
                                      "badge text-[9px] px-1.5 py-0.2",
                                      (prod.stock || 0) > 0 ? "badge-success" : "badge-danger"
                                    )}
                                  >
                                    {(prod.stock || 0) > 0 ? `${prod.stock} ${prod.unit || "pcs"}` : "Out of stock"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className="input-field text-center font-semibold"
                      value={item.qty === "" ? "" : item.qty}
                      onChange={(e) =>
                        updateItem(index, "qty", e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-2 py-2.5 text-center">
                    <select
                      className="input-field text-center text-[11px] py-1.5"
                      value={item.unit}
                      onChange={(e) => updateItem(index, "unit", e.target.value)}
                    >
                      <option value="pcs">pcs</option>
                      <option value="box">box</option>
                      <option value="kg">kg</option>
                      <option value="ltr">ltr</option>
                      <option value="pkt">pkt</option>
                      <option value="m">m</option>
                      <option value="set">set</option>
                    </select>
                  </td>

                  {/* Rate / Price */}
                  <td className="px-2 py-2.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      className="input-field text-right font-mono font-medium"
                      value={item.price === "" ? "" : item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                    />
                  </td>

                  {/* Discount % */}
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="0"
                      className="input-field text-center font-mono"
                      value={item.discount === "" ? "" : item.discount}
                      onChange={(e) =>
                        updateItem(index, "discount", e.target.value === "" ? "" : parseFloat(e.target.value))
                      }
                    />
                  </td>

                  {/* GST % */}
                  <td className="px-2 py-2.5 text-center">
                    <select
                      className="input-field text-center text-[11px] py-1.5"
                      value={item.tax}
                      onChange={(e) => updateItem(index, "tax", parseFloat(e.target.value) || 0)}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>

                  {/* Line Total Amount */}
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                    {formatCurrency(item.total)}
                  </td>

                  {/* Delete Row Button */}
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded"
                      title="Remove Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Action Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/30 flex items-center justify-between">
          <button
            type="button"
            onClick={addRow}
            className="btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Line Item</span>
          </button>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            Tip: Fill quantity and rate; GST and totals calculate automatically
          </span>
        </div>
      </div>

      {/* Bottom Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Terms & Customer Notes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Terms & Customer Notes
            </h3>
            <textarea
              rows={3}
              className="input-field resize-none leading-relaxed"
              placeholder="Terms, return conditions, warranty information..."
              value={invoiceDetails.notes}
              onChange={(e) => setInvoiceDetails({ ...invoiceDetails, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Right Column: Financial Totals Breakdown */}
        <div className="lg:col-span-5 card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Financial Breakdown
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">INR (₹)</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Taxable Amount (Subtotal):</span>
              <span className="font-mono text-slate-900 dark:text-zinc-200">{formatCurrency(taxableAmount)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Total Discount Applied:</span>
                <span className="font-mono">- {formatCurrency(totalDiscount)}</span>
              </div>
            )}

            {isInterState ? (
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Integrated GST (IGST):</span>
                <span className="font-mono text-slate-900 dark:text-zinc-200">+ {formatCurrency(igstAmount)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Central GST (CGST):</span>
                  <span className="font-mono text-slate-900 dark:text-zinc-200">+ {formatCurrency(cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>State GST (SGST):</span>
                  <span className="font-mono text-slate-900 dark:text-zinc-200">+ {formatCurrency(sgstAmount)}</span>
                </div>
              </>
            )}

            {parseFloat(roundOff) !== 0 && (
              <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px]">
                <span>Round-off Adjustment:</span>
                <span className="font-mono">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
              </div>
            )}
          </div>

          {/* Grand Total Box */}
          <div className="p-3.5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 dark:text-zinc-600">
                Net Grand Total
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                {saleType === "Cash" ? `Payment: ${paymentMode}` : "Payment: Credit Due"}
              </p>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="btn-secondary flex-1 py-2.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-[2] py-2.5 text-xs font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Issue Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Tax Invoice Preview"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div
            ref={invoicePreviewRef}
            className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 text-xs space-y-5 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-base font-bold uppercase text-slate-900">{businessInfo.name}</h2>
                <p className="text-[11px] text-slate-500">{businessInfo.address}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  GSTIN: {businessInfo.gstin || "N/A"} &middot; Ph: {businessInfo.phone}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-slate-900">TAX INVOICE</h3>
                <p className="font-mono font-bold text-slate-800 text-xs">{invoiceDetails.number}</p>
                <p className="text-[11px] text-slate-500">Date: {invoiceDetails.date}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To:</span>
                <p className="font-bold text-slate-800 text-xs">{customer.name || "Walk-in Customer"}</p>
                <p className="text-slate-500">{customer.phone}</p>
                <p className="text-slate-500">{customer.address}</p>
                {customer.gstin && <p className="font-mono text-slate-600">GSTIN: {customer.gstin}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Place of Supply:</span>
                <p className="font-semibold text-slate-800">{customer.state || businessInfo.state}</p>
                <p className="text-slate-500 mt-1">Payment Mode: <strong>{saleType === "Cash" ? paymentMode : "Credit Due"}</strong></p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-y bg-slate-50 font-bold text-slate-700">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2 text-center">Tax %</th>
                  <th className="py-2 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-slate-800">{item.name || "Untitled Item"}</td>
                    <td className="py-2 px-2 text-center">{item.qty} {item.unit}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatCurrency(item.price)}</td>
                    <td className="py-2 px-2 text-center">{item.tax}%</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pt-2 border-t text-[11px]">
              <div className="w-56 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">{formatCurrency(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax:</span>
                  <span className="font-mono">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t pt-1 text-xs">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sm">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-3 text-[10px] text-slate-500">
              <p className="font-bold uppercase text-slate-600">Terms & Conditions:</p>
              <p className="whitespace-pre-line">{invoiceDetails.notes}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="btn-secondary text-xs"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => {
                generateInvoicePDF(
                  {
                    invoiceNumber: invoiceDetails.number,
                    date: invoiceDetails.date,
                    customerName: customer.name || "Customer",
                    customerPhone: customer.phone,
                    customerAddress: customer.address,
                    customerGSTIN: customer.gstin,
                    items,
                    taxableAmount,
                    totalTax,
                    grandTotal,
                    saleType,
                  },
                  businessInfo
                );
              }}
              className="btn-primary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && savedSaleBatch && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate("/sales");
          }}
          title="Invoice Generated Successfully"
          maxWidth="max-w-md"
        >
          <div className="text-center py-3 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                Invoice {savedSaleBatch.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Amount: <strong className="font-mono text-slate-800 dark:text-zinc-200">{formatCurrency(savedSaleBatch.grandTotal)}</strong>
                {" "}&middot; {savedSaleBatch.saleType === "Cash" ? "Paid" : "Credit Due"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  generateInvoicePDF(savedSaleBatch, businessInfo);
                }}
                className="btn-secondary py-2.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const message = `Hello ${savedSaleBatch.customerName}, your invoice #${savedSaleBatch.invoiceNumber} for ${formatCurrency(savedSaleBatch.grandTotal)} has been generated. Thank you for your business!`;
                  window.open(`https://wa.me/${savedSaleBatch.customerPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="btn-primary py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/sales");
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300 py-1 font-medium transition-colors"
            >
              Return to Sales Invoices &rarr;
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesEntry;
