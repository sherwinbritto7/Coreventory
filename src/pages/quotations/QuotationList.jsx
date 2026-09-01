import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc,
  where
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail,
  MessageCircle,
  FileText,
  Plus,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { format } from 'date-fns';
import { generateInvoicePDF, generateInvoiceFromHTML } from '../../utils/invoiceGenerator';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

const QuotationList = () => {
  const { companyId } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();
  const quotationPreviewRef = useRef(null);

  const [businessInfo, setBusinessInfo] = useState({
    name: "My Business Name",
    address: "123 Business Street, City, State - 110001",
    gstin: "22AAAAA0000A1Z5",
    phone: "+91 98765 43210",
    email: "contact@business.com",
    logoURL: "",
    terms: "1. This is a quotation and not an invoice.\n2. Prices are valid for 7 days."
  });

  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, 'quotations'), 
      where('companyId', '==', companyId)
    );
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const quotData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by createdAt desc in memory
        quotData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setQuotations(quotData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error fetching quotations:", error);
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
            terms: data.terms || "1. This is a quotation and not an invoice.\n2. Prices are valid for 7 days."
          });
        }
      } catch (error) {
        console.error("Error fetching business profile:", error);
      }
    };
    fetchBusinessProfile();

    return () => unsubscribe();
  }, [companyId]);

  const handlePreviewQuotation = (quotation) => {
    setSelectedQuotation(quotation);
    setShowPreviewModal(true);
  };

  const shareViaWhatsApp = (quotation) => {
    const message = `Hello ${quotation.customerName}, your quotation ${quotation.quotationNumber} for ${formatCurrency(quotation.grandTotal)} is ready. Valid for 7 days. Thank you!`;
    const url = `https://wa.me/${quotation.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = (quotation) => {
    const subject = `Quotation ${quotation.quotationNumber} from ${businessInfo.name}`;
    const body = `Hello ${quotation.customerName},\n\nPlease find your quotation details below:\nQuotation #: ${quotation.quotationNumber}\nEstimated Total: ${formatCurrency(quotation.grandTotal)}\nDate: ${format(new Date(quotation.date.seconds * 1000), 'dd MMM yyyy')}\n\nThis is an estimated quote and valid for 7 days.\n\nThank you!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const filteredQuotations = quotations.filter(quotation => 
    quotation.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Quotation History</h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage all generated quotations.</p>
        </div>
        <button 
          onClick={() => navigate('/quotations/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card overflow-hidden border-none shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by customer or quote #..."
              className="input-field pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Quote Detail</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4 text-right">Estimated Total</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-tight">{quotation.quotationNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{quotation.customerName}</span>
                      <span className="text-[10px] font-bold text-slate-500">{quotation.customerPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                      {quotation.items?.length || 0} Items
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right font-display whitespace-nowrap">
                    {formatCurrency(quotation.grandTotal)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {quotation.date?.seconds ? format(new Date(quotation.date.seconds * 1000), 'dd MMM yyyy, hh:mm a') : '---'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handlePreviewQuotation(quotation)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Preview & Download"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => shareViaWhatsApp(quotation)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => shareViaEmail(quotation)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        title="Share via Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedQuotation && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Quotation Preview"
          maxWidth="max-w-4xl"
        >
          <div ref={quotationPreviewRef} className="bg-white rounded-2xl overflow-hidden">
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
                  QUOTATION
                </h2>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none space-y-2">
                  <p>
                    No:{" "}
                    <span className="text-slate-900 ml-2 uppercase">
                      {selectedQuotation.quotationNumber}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    <span className="text-slate-900 ml-2">
                      {selectedQuotation.date?.seconds ? format(new Date(selectedQuotation.date.seconds * 1000), "dd MMM yyyy") : '---'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-3">
                    Quote To
                  </p>
                  <h4 className="font-black text-slate-900 text-lg leading-none">
                    {selectedQuotation.customerName || "Walk-in Customer"}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium">
                    {selectedQuotation.customerPhone}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                    {selectedQuotation.customerAddress || "No address provided"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Status
                  </p>
                  <div className="inline-flex items-center justify-center h-6 px-4 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Estimated Quote
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
                    {selectedQuotation.items?.map((item, idx) => (
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
                    const total = parseFloat(selectedQuotation.grandTotal || 0);
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
                            Estimated Total
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

              <div id="quotationlist-preview-actions" className="pt-10 flex gap-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const actionsEl = document.getElementById('quotationlist-preview-actions');
                    if (actionsEl) actionsEl.style.display = 'none';
                    const doc = await generateInvoiceFromHTML(quotationPreviewRef.current);
                    if (actionsEl) actionsEl.style.display = '';
                    if (doc) {
                      doc.save(`${selectedQuotation.quotationNumber}.pdf`);
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

export default QuotationList;
