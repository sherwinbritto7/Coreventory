import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  AlertOctagon, 
  CheckCircle2, 
  History,
  TrendingDown,
  TrendingUp,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const StockAdjustments = () => {
  const { companyId, userData } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    type: 'Decrease', // 'Increase' or 'Decrease'
    adjustmentQty: 1,
    reason: 'Damaged / Broken Goods', // Damaged, Expired, Theft/Loss, Audit Variance, Internal Consumption
    date: new Date().toISOString().split('T')[0],
    notes: '',
    currentStock: 0
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Products
        const prodSnap = await getDocs(query(collection(db, 'products'), where('companyId', '==', companyId)));
        const prodList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(prodList);

        // Adjustments history
        const adjSnap = await getDocs(query(collection(db, 'stock_adjustments'), where('companyId', '==', companyId)));
        const adjList = adjSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        adjList.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setAdjustments(adjList);
      } catch (err) {
        console.error('Error fetching adjustments:', err);
        toast.error('Failed to load stock adjustments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleProductSelect = (pId) => {
    const prod = products.find(p => p.id === pId);
    if (prod) {
      setFormData(prev => ({
        ...prev,
        productId: pId,
        productName: prod.name,
        currentStock: prod.stock || 0
      }));
    }
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!formData.productId) {
      toast.error('Please select a product');
      return;
    }
    const qty = parseInt(formData.adjustmentQty) || 0;
    if (qty <= 0) {
      toast.error('Adjustment quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const prodRef = doc(db, 'products', formData.productId);
      const prodSnap = await getDoc(prodRef);
      if (!prodSnap.exists()) {
        toast.error('Product not found');
        return;
      }

      const curStock = prodSnap.data().stock || 0;
      const stockDelta = formData.type === 'Increase' ? qty : -qty;
      const newStock = Math.max(0, curStock + stockDelta);

      // 1. Update Product Stock
      await updateDoc(prodRef, {
        stock: newStock,
        updatedAt: new Date()
      });

      // 2. Add Adjustment Audit Record
      const adjRecord = {
        ...formData,
        companyId,
        stockBefore: curStock,
        stockAfter: newStock,
        createdAt: new Date(),
        adjustedBy: userData?.name || 'Staff'
      };

      const docRef = await addDoc(collection(db, 'stock_adjustments'), adjRecord);
      setAdjustments(prev => [{ id: docRef.id, ...adjRecord }, ...prev]);
      
      // Update local product list
      setProducts(prev => prev.map(p => p.id === formData.productId ? { ...p, stock: newStock } : p));
      
      setShowModal(false);
      toast.success(`Stock adjusted! New stock: ${newStock}`);
    } catch (err) {
      console.error('Error saving adjustment:', err);
      toast.error('Failed to save adjustment');
    } finally {
      setLoading(false);
    }
  };

  const filtered = adjustments.filter(a => {
    const q = searchQuery.toLowerCase();
    return !q || 
      a.productName?.toLowerCase().includes(q) || 
      a.reason?.toLowerCase().includes(q) ||
      a.adjustedBy?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="w-7 h-7 text-amber-600" /> Stock Adjustments & Waste Logging
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Log inventory audits, damaged stock, expired goods, theft/loss, and manual stock updates.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              productId: '',
              productName: '',
              type: 'Decrease',
              adjustmentQty: 1,
              reason: 'Damaged / Broken Goods',
              date: new Date().toISOString().split('T')[0],
              notes: '',
              currentStock: 0
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Record Stock Adjustment
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, reason, adjusted by..."
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Loading adjustments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <History className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No stock adjustments logged</p>
            <p className="text-xs text-slate-500 mt-1">Manual adjustments will appear here with before/after counts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Adjustment Type</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Qty Changed</th>
                  <th className="py-3 px-4">Stock Before → After</th>
                  <th className="py-3 px-4 text-right">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {adj.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {adj.productName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        adj.type === 'Increase'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {adj.type === 'Increase' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {adj.type === 'Increase' ? '+ Stock Added' : '- Stock Reduced'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {adj.reason}
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm text-slate-900 dark:text-white">
                      {adj.type === 'Increase' ? `+${adj.adjustmentQty}` : `-${adj.adjustmentQty}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {adj.stockBefore} → <strong className="text-slate-900 dark:text-white">{adj.stockAfter}</strong>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {adj.adjustedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ADJUSTMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" /> Record Stock Adjustment
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">Choose item...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Current: {p.stock} {p.unit || 'pcs'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Action Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input-field text-xs font-bold"
                  >
                    <option value="Decrease">Decrease Stock (-)</option>
                    <option value="Increase">Increase Stock (+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.adjustmentQty}
                    onChange={(e) => setFormData({...formData, adjustmentQty: parseInt(e.target.value) || 1})}
                    className="input-field text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Variance</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="input-field text-xs"
                >
                  <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                  <option value="Expired / Past Expiry Date">Expired / Past Expiry Date</option>
                  <option value="Theft / Lost / Missing">Theft / Lost / Missing</option>
                  <option value="Physical Count Audit Variance">Physical Count Audit Variance</option>
                  <option value="Internal Office / Store Consumption">Internal Office / Store Consumption</option>
                  <option value="Supplier Free Sample Received">Supplier Free Sample Received</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Adjustment Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustments;
