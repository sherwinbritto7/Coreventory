import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const ReturnsAndNotes = () => {
  const { companyId, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('credit'); // 'credit' (Sales Returns) or 'debit' (Purchase Returns)
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for Return / Note
  const [formData, setFormData] = useState({
    noteType: 'credit', // 'credit' or 'debit'
    noteNo: `CN-${Date.now().toString().slice(-6)}`,
    referenceInvoiceId: '',
    originalDocNo: '',
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    partyPhone: '',
    partyGSTIN: '',
    reason: 'Damaged / Defective Goods',
    items: [{ productId: '', name: '', qty: 1, price: 0, total: 0 }],
    refundType: 'Credit to Account', // 'Credit to Account' or 'Cash Refund'
    totalAmount: 0
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Credit and Debit notes
        const qNotes = query(collection(db, 'returns_notes'), where('companyId', '==', companyId));
        const snapNotes = await getDocs(qNotes);
        const listNotes = snapNotes.docs.map(d => ({ id: d.id, ...d.data() }));
        listNotes.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setNotes(listNotes);

        // 2. Fetch Sales Invoices for reference
        const qSales = query(collection(db, 'sales'), where('companyId', '==', companyId));
        const snapSales = await getDocs(qSales);
        setInvoices(snapSales.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Fetch Purchases for reference
        const qPur = query(collection(db, 'purchases'), where('companyId', '==', companyId));
        const snapPur = await getDocs(qPur);
        setPurchases(snapPur.docs.map(d => ({ id: d.id, ...d.data() })));

        // 4. Fetch Products
        const qProd = query(collection(db, 'products'), where('companyId', '==', companyId));
        const snapProd = await getDocs(qProd);
        setProducts(snapProd.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading returns data:', err);
        toast.error('Failed to load credit / debit notes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // Handle selecting an original invoice/purchase to auto-populate items
  const handleSelectReferenceDoc = (docId) => {
    if (formData.noteType === 'credit') {
      const sale = invoices.find(s => s.id === docId);
      if (sale) {
        setFormData(prev => ({
          ...prev,
          referenceInvoiceId: docId,
          originalDocNo: sale.invoiceNumber || sale.invoiceNo || '',
          partyName: sale.customerName || '',
          partyPhone: sale.customerPhone || '',
          partyGSTIN: sale.customerGSTIN || '',
          items: (sale.items || []).map(i => ({
            productId: i.productId || i.id || '',
            name: i.name || '',
            qty: 1,
            maxQty: i.qty || i.quantity || 1,
            price: i.price || 0,
            total: i.price || 0
          }))
        }));
      }
    } else {
      const pur = purchases.find(p => p.id === docId);
      if (pur) {
        setFormData(prev => ({
          ...prev,
          referenceInvoiceId: docId,
          originalDocNo: pur.billNumber || pur.invoiceNo || pur.id?.slice(0, 6),
          partyName: pur.supplierName || '',
          partyPhone: pur.supplierPhone || '',
          partyGSTIN: pur.supplierGSTIN || '',
          items: (pur.items || []).map(i => ({
            productId: i.productId || i.id || '',
            name: i.name || '',
            qty: 1,
            maxQty: i.qty || i.quantity || 1,
            price: i.price || i.buyingPrice || 0,
            total: i.price || i.buyingPrice || 0
          }))
        }));
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'qty' || field === 'price') {
        items[index].total = (parseFloat(items[index].qty) || 0) * (parseFloat(items[index].price) || 0);
      }
      return { ...prev, items };
    });
  };

  const totalReturnAmount = formData.items.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!formData.partyName) {
      toast.error('Please specify party name');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one returned item');
      return;
    }

    try {
      setLoading(true);
      const noteDoc = {
        ...formData,
        companyId,
        totalAmount: totalReturnAmount,
        createdAt: new Date(),
        createdBy: userData?.name || 'Staff'
      };

      // 1. Save Return/Note record
      const docRef = await addDoc(collection(db, 'returns_notes'), noteDoc);

      // 2. Adjust Product Inventory Stock:
      // - Credit Note (Sales Return) -> Add returned items back to Stock
      // - Debit Note (Purchase Return) -> Subtract returned items from Stock
      for (const item of formData.items) {
        if (item.productId) {
          const pRef = doc(db, 'products', item.productId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const currentStock = pSnap.data().stock || 0;
            const stockDelta = formData.noteType === 'credit' 
              ? (item.qty || 1) // Restock for sales return
              : -(item.qty || 1); // Deduct for purchase return

            await updateDoc(pRef, {
              stock: Math.max(0, currentStock + stockDelta),
              updatedAt: new Date()
            });
          }
        }
      }

      setNotes(prev => [{ id: docRef.id, ...noteDoc }, ...prev]);
      setShowCreateModal(false);
      toast.success(`${formData.noteType === 'credit' ? 'Credit Note' : 'Debit Note'} created successfully!`);
    } catch (err) {
      console.error('Error saving note:', err);
      toast.error('Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesTab = (n.noteType || 'credit') === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      n.noteNo?.toLowerCase().includes(q) || 
      n.partyName?.toLowerCase().includes(q) || 
      n.originalDocNo?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <RotateCcw className="w-7 h-7 text-primary-600" /> Sales & Purchase Returns
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Issue Credit Notes for Sales Returns (restock) & Debit Notes for Purchase Returns (reverse liability).
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              noteType: activeTab,
              noteNo: `${activeTab === 'credit' ? 'CN' : 'DN'}-${Date.now().toString().slice(-6)}`,
              referenceInvoiceId: '',
              originalDocNo: '',
              date: new Date().toISOString().split('T')[0],
              partyName: '',
              partyPhone: '',
              partyGSTIN: '',
              reason: 'Damaged / Defective Goods',
              items: [{ productId: '', name: '', qty: 1, price: 0, total: 0 }],
              refundType: 'Credit to Account',
              totalAmount: 0
            });
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New {activeTab === 'credit' ? 'Credit Note (Sale Return)' : 'Debit Note (Purchase Return)'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('credit')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'credit'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          Credit Notes (Sales Returns)
        </button>
        <button
          onClick={() => setActiveTab('debit')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'debit'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          Debit Notes (Purchase Returns)
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'credit' ? 'Credit Note' : 'Debit Note'}, Party, Original Inv...`}
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      {/* Notes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Loading records...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <RotateCcw className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No {activeTab === 'credit' ? 'Credit Notes' : 'Debit Notes'} recorded</p>
            <p className="text-xs text-slate-500 mt-1">Record returns to automatically update inventory and financial balance</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Note No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Original Ref</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Refund Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredNotes.map(n => (
                  <tr key={n.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {n.noteNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {n.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {n.originalDocNo || '---'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {n.partyName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {n.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[10px]">
                        {n.refundType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(n.totalAmount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE RETURN NOTE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary-600" />
                New {formData.noteType === 'credit' ? 'Credit Note (Sales Return)' : 'Debit Note (Purchase Return)'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Note Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.noteNo}
                    onChange={(e) => setFormData({...formData, noteNo: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Select {formData.noteType === 'credit' ? 'Sales Invoice' : 'Purchase Bill'}
                  </label>
                  <select
                    value={formData.referenceInvoiceId}
                    onChange={(e) => handleSelectReferenceDoc(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">Choose original document...</option>
                    {formData.noteType === 'credit' 
                      ? invoices.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNumber || inv.invoiceNo} - {inv.customerName} ({formatCurrency(inv.grandTotal || inv.total || 0)})
                          </option>
                        ))
                      : purchases.map(pur => (
                          <option key={pur.id} value={pur.id}>
                            {pur.billNumber || pur.invoiceNo || pur.id.slice(0, 6)} - {pur.supplierName} ({formatCurrency(pur.grandTotal || pur.amount || 0)})
                          </option>
                        ))
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Party / Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.partyName}
                    onChange={(e) => setFormData({...formData, partyName: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Return</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="input-field text-xs"
                  >
                    <option value="Damaged / Defective Goods">Damaged / Defective Goods</option>
                    <option value="Wrong Item Dispatched">Wrong Item Dispatched</option>
                    <option value="Customer Cancellation">Customer Cancellation</option>
                    <option value="Quality Not Satisfactory">Quality Not Satisfactory</option>
                    <option value="Excess Quantity Returned">Excess Quantity Returned</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-black uppercase text-slate-400 block">Returned Goods (Will adjust stock)</label>
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="input-field flex-1 text-xs font-medium"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Return Qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                      className="input-field w-24 text-xs text-center font-bold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="input-field w-28 text-xs text-right font-bold"
                    />
                    <div className="w-24 text-right text-xs font-black text-slate-800 dark:text-white">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Settlement Method</label>
                  <select
                    value={formData.refundType}
                    onChange={(e) => setFormData({...formData, refundType: e.target.value})}
                    className="input-field text-xs"
                  >
                    <option value="Credit to Account">Credit to Party Ledger Balance</option>
                    <option value="Cash Refund">Cash / Bank Refund Out</option>
                  </select>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <span className="text-xs text-slate-400">Total Return Value</span>
                  <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                    {formatCurrency(totalReturnAmount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Save {formData.noteType === 'credit' ? 'Credit Note' : 'Debit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsAndNotes;
