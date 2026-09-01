import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc,
  getDocs,
  where,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from "../../context/AuthContext";
import { 
  Search, 
  Filter, 
  Download, 
  Share2, 
  Eye, 
  MoreHorizontal, 
  Mail, 
  MessageCircle, 
  FileText, 
  ShoppingCart,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { generateInvoicePDF, generateInvoiceFromHTML } from '../../utils/invoiceGenerator';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import SalesEntry from './SalesEntry';

import { useNavigate } from 'react-router-dom';

const SalesList = () => {
  const { companyId } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();
  const invoicePreviewRef = useRef(null);

  const [businessInfo, setBusinessInfo] = useState({
    name: "My Business Name",
    address: "123 Business Street, City, State - 110001",
    gstin: "22AAAAA0000A1Z5",
    phone: "+91 98765 43210",
    email: "contact@business.com",
    logoURL: "",
    terms: "1. Goods once sold will not be returned.\n2. Warranty as per manufacturer terms."
  });

  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, 'sales'), 
      where('companyId', '==', companyId)
    );
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt desc in memory
        salesData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setSales(salesData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in SalesList:", error);
        setLoading(false);
      }
    );

    const fetchBusinessProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', companyId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBusinessInfo({
            name: data.businessName || "My Business Name",
            address: data.address || "123 Business Street, City, State - 110001",
            gstin: data.gstin || "22AAAAA0000A1Z5",
            phone: data.phone || "+91 98765 43210",
            email: data.email || "contact@business.com",
            logoURL: data.logoURL || "",
            terms: data.terms || "1. Goods once sold will not be returned.\n2. Warranty as per manufacturer terms."
          });
        }
      } catch (error) {
        console.error("Error fetching business profile:", error);
      }
    };
    fetchBusinessProfile();

    return () => unsubscribe();
  }, [companyId]);

  const handlePreviewInvoice = (sale) => {
    setSelectedSale(sale);
    setShowPreviewModal(true);
  };

  const executeDownload = async (sale) => {
    const doc = await generateInvoicePDF(sale, businessInfo);
    if (doc) {
      doc.save(`${sale.invoiceNumber}.pdf`);
      toast.success('Invoice downloading...');
    } else {
      toast.error('Failed to generate PDF');
    }
  };

  const shareViaWhatsApp = (sale) => {
    const message = `Hello ${sale.customerName}, your invoice ${sale.invoiceNumber} for ${formatCurrency(sale.grandTotal)} is ready. Thank you for your business!`;
    const url = `https://wa.me/${sale.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = (sale) => {
    const subject = `Invoice ${sale.invoiceNumber} from ${businessInfo.name}`;
    const body = `Hello ${sale.customerName},\n\nPlease find your invoice details below:\nInvoice #: ${sale.invoiceNumber}\nTotal: ${formatCurrency(sale.grandTotal)}\nDate: ${format(new Date(sale.date.seconds * 1000), 'dd MMM yyyy')}\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleMarkAsPaid = async (sale) => {
    if (!window.confirm("Mark this invoice as Paid? This will update the customer's credit balance.")) return;
    
    try {
      const batch = writeBatch(db);
      
      // 1. Update Sale Status
      const saleRef = doc(db, 'sales', sale.id);
      batch.update(saleRef, {
        paymentStatus: 'Paid',
        paidAt: new Date()
      });
      
      // 2. Update Customer Credit Balance (Decrement)
      if (sale.customerPhone) {
        const q = query(collection(db, 'customers'), where('phone', '==', sale.customerPhone));
        const snap = await getDocs(q);
        if (!snap.empty) {
          batch.update(snap.docs[0].ref, {
            creditBalance: increment(-sale.grandTotal)
          });
        }
      }
      
      await batch.commit();
      toast.success('Invoice marked as Paid');
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error(error);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Sales History</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage all your customer sales.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/quotations/new')}
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200/80 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 font-medium text-xs py-2 px-3.5 rounded-lg transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Quotation</span>
          </button>
          <button 
            onClick={() => navigate('/sales/new')}
            className="btn-primary"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card overflow-hidden border border-slate-200/80 dark:border-zinc-800/80 p-0 shadow-sm">
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by customer name, invoice #, phone..."
              className="input-field pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary py-1.5 px-2.5">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Invoice Detail</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Mode</th>
                <th className="px-6 py-4 text-center">Payment</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight">{sale.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{sale.items.length} Items</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{sale.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{sale.customerPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest leading-none",
                      sale.saleType === "Credit" ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                    )}>
                      {sale.saleType || "Cash"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(() => {
                      const currentStatus = sale.paymentStatus || (sale.saleType === "Cash" ? "Paid" : "Unpaid");
                      return (
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest leading-none",
                          currentStatus === "Paid" 
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-none" 
                            : "bg-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none"
                        )}>
                          {currentStatus}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right font-display whitespace-nowrap">
                    {formatCurrency(sale.grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(sale.date.seconds * 1000), 'dd MMM yyyy, hh:mm a')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {sale.paymentStatus === "Unpaid" && (
                        <button 
                          onClick={() => handleMarkAsPaid(sale)}
                          className="px-2 py-1 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-all mr-2 whitespace-nowrap"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => handlePreviewInvoice(sale)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Preview & Download"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => shareViaWhatsApp(sale)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => shareViaEmail(sale)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Share via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                    No sales records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedSale && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Invoice Preview"
          maxWidth="max-w-4xl"
        >
          <div ref={invoicePreviewRef} className="bg-white rounded-2xl overflow-hidden">
            {/* Header with Background */}
            <div className="bg-slate-50 p-8 flex justify-between items-start border-b border-slate-100">
            <div className="flex items-start gap-4">
              {businessInfo.logoURL ? (
                <img
                  src={businessInfo.logoURL}
                  alt="Logo"
                  className="w-16 h-16 object-contain rounded-lg"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="p-1.5 bg-primary-600 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {businessInfo.name}
                </h1>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none space-y-2">
                  <p className="max-w-[250px]">{businessInfo.address}</p>
                  <p>
                    GSTIN: {businessInfo.gstin} | Email: {businessInfo.email} | Phone: {businessInfo.phone}
                  </p>
                </div>
              </div>
            </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
                  INVOICE
                </h2>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none space-y-2">
                  <p>
                    No:{" "}
                    <span className="text-slate-900 ml-2 uppercase">
                      {selectedSale.invoiceNumber}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="text-slate-900 ml-2">
                      {format(new Date(selectedSale.date.seconds * 1000), "dd MMM yyyy")}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-3">
                    Bill To
                  </p>
                  <h4 className="font-black text-slate-900 text-lg leading-none">
                    {selectedSale.customerName || "Walk-in Customer"}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {selectedSale.customerPhone}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                    {selectedSale.customerAddress || "No address provided"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Payment Info
                  </p>
                  <div className="inline-flex items-center justify-center h-6 px-4 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Mode: {selectedSale.saleType}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-10 overflow-hidden border border-slate-100 rounded-2xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-4 text-left">Description</th>
                      <th className="px-4 py-4 text-center">Qty / Unit</th>
                      <th className="px-4 py-4 text-right">Price</th>
                      <th className="px-4 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx} className="text-slate-900">
                        <td className="px-4 py-4 font-bold">
                          {item.name || "---"}
                        </td>
                        <td className="px-4 py-4 text-center font-medium">
                          {item.qty} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-right font-medium">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-4 text-right font-black">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-[280px] space-y-3">
                  {(() => {
                    const total = parseFloat(selectedSale.grandTotal || 0);
                    const taxable = total / 1.18;
                    const gst = total - taxable;
                    const halfGst = gst / 2;
                    return (
                      <>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Taxable Amount</span>
                          <span className="text-slate-900">{formatCurrency(taxable)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>SGST (9%)</span>
                          <span className="text-slate-900">{formatCurrency(halfGst)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>CGST (9%)</span>
                          <span className="text-slate-900">{formatCurrency(halfGst)}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline pr-2">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                            Grand Total
                          </span>
                          <span className="text-2xl font-black text-primary-600 font-display tracking-tight ml-4">
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 mt-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Terms & Conditions</p>
                <div className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                  {businessInfo.terms}
                </div>
              </div>

              <div id="saleslist-preview-actions" className="pt-10 flex gap-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const actionsEl = document.getElementById('saleslist-preview-actions');
                    if (actionsEl) actionsEl.style.display = 'none';
                    const doc = await generateInvoiceFromHTML(invoicePreviewRef.current);
                    if (actionsEl) actionsEl.style.display = '';
                    if (doc) {
                      doc.save(`${selectedSale.invoiceNumber}.pdf`);
                      toast.success('PDF Downloaded!');
                    }
                  }}
                  className="flex-[2] px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesList;
