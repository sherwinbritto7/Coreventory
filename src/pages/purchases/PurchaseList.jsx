import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment,
  writeBatch,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Trash2, 
  Truck, 
  Loader2,
  Calendar,
  Package
} from 'lucide-react';
import { formatCurrency, formatIndianNumber } from '../../lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const PurchaseList = () => {
  const { companyId } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, 'purchases'), 
      where('companyId', '==', companyId)
    );
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const purchaseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by date desc in memory
        purchaseData.sort((a, b) => {
          const timeA = a.date?.seconds || 0;
          const timeB = b.date?.seconds || 0;
          return timeB - timeA;
        });
        setPurchases(purchaseData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in PurchaseList:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [companyId]);

  const filteredPurchases = purchases.filter(p => 
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Purchase History</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage stock info and supplier records.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase</span>
        </button>
      </div>

      <div className="card border border-slate-200/80 dark:border-zinc-800/80 p-0 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by product, supplier name..."
              className="input-field pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 dark:text-white">{p.productName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.supplierName}</td>
                  <td className="px-6 py-4 font-bold">{p.qty} {p.unit}</td>
                  <td className="px-6 py-4">{formatCurrency(p.buyingPrice)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(p.buyingPrice * p.qty)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {p.date?.seconds ? format(new Date(p.date.seconds * 1000), 'dd MMM yyyy') : '---'}
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                    No purchase records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Record New Purchase"
        maxWidth="max-w-4xl"
      >
        <PurchaseEntry onSuccess={() => setShowAddModal(false)} />
      </Modal>
    </div>
  );
};

// Internal component for the form
const PurchaseEntry = ({ onSuccess }) => {
  const { user, companyId } = useAuth();
  const supplierRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    supplierId: '',
    supplierName: '',
    qty: 0,
    buyingPrice: 0,
    unit: 'pcs'
  });

  useEffect(() => {
    // simplified: fetch all products and suppliers for dropdowns
    const fetchDropdowns = async () => {
      if (!companyId) return;

      const qProd = query(collection(db, 'products'), where('companyId', '==', companyId));
      const prodSnap = await getDocs(qProd);
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const qSupp = query(collection(db, 'suppliers'), where('companyId', '==', companyId));
      const suppSnap = await getDocs(qSupp);
      setSuppliers(suppSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchDropdowns();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.supplierName) {
      toast.error('Please select product and enter supplier');
      return;
    }

    setLoading(true);
    try {
      const selectedProd = products.find(p => p.id === formData.productId);
      const batch = writeBatch(db);
      
      const purchaseData = {
        ...formData,
        unit: selectedProd?.unit || 'pcs',
        productName: selectedProd?.name || '',
        date: new Date(),
        createdBy: user.uid,
        companyId
      };

      // 1. Record Purchase
      const purchaseRef = doc(collection(db, 'purchases'));
      batch.set(purchaseRef, purchaseData);
      
      // 2. Update Stock
      const productRef = doc(db, 'products', formData.productId);
      batch.update(productRef, {
        stock: increment(formData.qty)
      });

      // 3. Supplier Management
      if (formData.supplierName) {
        // Find if supplier exists
        const existingSupp = suppliers.find(s => s.name.toLowerCase() === formData.supplierName.toLowerCase());
        
        if (!existingSupp) {
          const newSuppRef = doc(collection(db, 'suppliers'));
          batch.set(newSuppRef, {
            name: formData.supplierName,
            companyId,
            createdAt: new Date(),
            totalPurchases: formData.buyingPrice * formData.qty,
            lastPurchase: new Date()
          });
        } else {
          batch.update(doc(db, 'suppliers', existingSupp.id), {
            totalPurchases: increment(formData.buyingPrice * formData.qty),
            lastPurchase: new Date()
          });
        }
      }

      await batch.commit();
      
      toast.success('Purchase recorded and vendor database updated!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to record purchase');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Product *</label>
        <select 
          required
          className="input-field"
          value={formData.productId}
          onChange={(e) => setFormData({...formData, productId: e.target.value})}
        >
          <option value="">Choose a product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.stock})</option>)}
        </select>
      </div>

      <div className="space-y-2 relative" ref={supplierRef}>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supplier Name *</label>
        <input 
          type="text" 
          required 
          className="input-field" 
          placeholder="e.g. ABC Wholesalers"
          value={formData.supplierName}
          onChange={(e) => {
            setFormData({...formData, supplierName: e.target.value});
            setSearching(e.target.value.length > 0);
          }}
          onFocus={() => formData.supplierName && setSearching(true)}
        />
        {searching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
            <div className="p-2 space-y-1">
              {suppliers
                .filter(s => s.name?.toLowerCase().includes(formData.supplierName.toLowerCase()))
                .map(supp => (
                  <button
                    key={supp.id}
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all text-left group"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        supplierName: supp.name,
                        supplierId: supp.id
                      });
                      setSearching(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors text-sm">{supp.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{supp.category || 'General Supplier'}</span>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary-500" />
                  </button>
                ))}
              {suppliers.filter(s => s.name?.toLowerCase().includes(formData.supplierName.toLowerCase())).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  Add "{formData.supplierName}" as new supplier
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 p-2 border-t border-slate-100 dark:border-slate-800">
               <button 
                type="button"
                onClick={() => setSearching(false)}
                className="w-full py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500"
               >
                 Close Suggestions
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity *</label>
          <input 
            type="number" 
            required 
            className="input-field"
            value={formData.qty}
            onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value)})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Buying Price (per unit) *</label>
          <input 
            type="number" 
            required 
            className="input-field"
            value={formData.buyingPrice}
            onChange={(e) => setFormData({...formData, buyingPrice: parseFloat(e.target.value)})}
          />
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <button 
          type="button" 
          onClick={onSuccess}
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-[2] btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Record Purchase'}
        </button>
      </div>
    </form>
  );
};


export default PurchaseList;
