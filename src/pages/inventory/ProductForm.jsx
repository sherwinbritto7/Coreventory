import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { Loader2, Layers, Calendar, Tag, Box, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProductForm = ({ initialData, onSuccess, onCancel }) => {
  const { isAdmin, companyId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [godowns, setGodowns] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    brand: '',
    category: '',
    subcategory: '',
    hsn: '',
    unit: 'pcs',
    secondaryUnit: '',
    conversionFactor: 1, // e.g. 1 Box = 12 Pcs
    buyingPrice: 0,
    sellingPrice: 0,
    gstPercent: 18,
    stock: 0,
    lowStockThreshold: 10,
    hasBatch: false,
    batchNumber: '',
    mfgDate: '',
    expiryDate: '',
    hasSerial: false,
    serialNumbers: '',
    godownId: 'main',
    ...initialData
  });

  const categories = ['Electronics', 'Clothing', 'Groceries', 'Furniture', 'Hardware', 'Pharma & Health', 'Automotive', 'Others'];
  const units = ['pcs', 'box', 'kg', 'ltr', 'm', 'pkt', 'carton', 'pair', 'doz'];

  // Fetch godowns list
  useEffect(() => {
    if (!companyId) return;
    const fetchGodowns = async () => {
      try {
        const q = query(collection(db, 'godowns'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGodowns(list);
      } catch (err) {
        console.error('Error fetching godowns:', err);
      }
    };
    fetchGodowns();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateDoc(doc(db, 'products', initialData.id), {
          ...formData,
          updatedAt: new Date()
        });
        toast.success('Product updated successfully');
      } else {
        if (!companyId) {
          toast.error("Company ID missing. Cannot add product.");
          return;
        }
        await addDoc(collection(db, 'products'), {
          ...formData,
          companyId,
          createdAt: new Date()
        });
        toast.success('Product added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Error saving product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
      {/* 1. Basic Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Name *</label>
          <input 
            type="text" 
            required 
            className="input-field text-xs" 
            placeholder="e.g. Paracetamol 500mg or iPhone 15 Pro"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brand / Manufacturer</label>
          <input 
            type="text" 
            className="input-field text-xs" 
            placeholder="e.g. Apple, Cipla, Samsung"
            value={formData.brand}
            onChange={(e) => setFormData({...formData, brand: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SKU / Item Code *</label>
          <input 
            type="text" 
            required 
            className="input-field text-xs" 
            placeholder="e.g. IP15PR-128-BLK"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Barcode / EAN (Scan)</label>
          <input 
            type="text" 
            className="input-field text-xs" 
            placeholder="e.g. 8901234567890"
            value={formData.barcode}
            onChange={(e) => setFormData({...formData, barcode: e.target.value})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">HSN / SAC Code</label>
          <input 
            type="text" 
            className="input-field text-xs" 
            placeholder="e.g. 3004 or 8517"
            value={formData.hsn}
            onChange={(e) => setFormData({...formData, hsn: e.target.value})}
          />
        </div>
      </div>

      {/* 2. Categorization & Dual Units */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
          <select 
            className="input-field text-xs"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subcategory</label>
          <input 
            type="text"
            placeholder="e.g. Smartphones, Syrups"
            className="input-field text-xs"
            value={formData.subcategory}
            onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Base Unit</label>
          <select 
            className="input-field text-xs"
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          >
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Secondary Unit (Dual)</label>
          <select 
            className="input-field text-xs"
            value={formData.secondaryUnit}
            onChange={(e) => setFormData({...formData, secondaryUnit: e.target.value})}
          >
            <option value="">None</option>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Dual Unit Conversion Factor if secondary unit selected */}
      {formData.secondaryUnit && (
        <div className="p-3 bg-primary-50/50 dark:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800 flex items-center gap-3 text-xs">
          <Box className="w-4 h-4 text-primary-600" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Conversion Rate: 1 <strong>{formData.secondaryUnit}</strong> = 
          </span>
          <input
            type="number"
            min="1"
            value={formData.conversionFactor}
            onChange={(e) => setFormData({...formData, conversionFactor: parseFloat(e.target.value) || 1})}
            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-center font-bold text-xs"
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formData.unit}
          </span>
        </div>
      )}

      {/* 3. Pricing & Tax */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Buying / Purchase Price (₹)</label>
          <input 
            type="number" 
            step="0.01"
            disabled={!isAdmin}
            className="input-field text-xs disabled:opacity-50 disabled:bg-slate-50"
            value={formData.buyingPrice}
            onChange={(e) => setFormData({...formData, buyingPrice: parseFloat(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Selling Price (₹) *</label>
          <input 
            type="number" 
            step="0.01"
            required
            className="input-field text-xs font-bold text-primary-600"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GST Slab (%)</label>
          <select 
            className="input-field text-xs font-bold"
            value={formData.gstPercent}
            onChange={(e) => setFormData({...formData, gstPercent: parseInt(e.target.value) || 0})}
          >
            <option value="0">0% (Exempted)</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% Standard GST</option>
            <option value="28">28% Luxury GST</option>
          </select>
        </div>
      </div>

      {/* 4. Stock & Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Stock Qty</label>
          <input 
            type="number" 
            className="input-field text-xs font-bold"
            value={formData.stock}
            onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Low Stock Alert Level</label>
          <input 
            type="number" 
            className="input-field text-xs"
            value={formData.lowStockThreshold}
            onChange={(e) => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Storage Godown</label>
          <select 
            className="input-field text-xs"
            value={formData.godownId}
            onChange={(e) => setFormData({...formData, godownId: e.target.value})}
          >
            <option value="main">Main Godown / Shop Floor</option>
            {godowns.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.location || 'Branch'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Batch & Expiry Management (FEFO) */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            <label className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
              Enable Batch & Expiry Date Tracking (FEFO)
            </label>
          </div>
          <input
            type="checkbox"
            checked={formData.hasBatch}
            onChange={(e) => setFormData({...formData, hasBatch: e.target.checked})}
            className="w-4 h-4 text-primary-600 rounded cursor-pointer"
          />
        </div>

        {formData.hasBatch && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Batch Number</label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-X1"
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                className="input-field text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mfg Date</label>
              <input
                type="date"
                value={formData.mfgDate}
                onChange={(e) => setFormData({...formData, mfgDate: e.target.value})}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="input-field text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Serial Number / IMEI Tracking */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary-600" />
            <label className="text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
              Serial Number / IMEI Tracking
            </label>
          </div>
          <input
            type="checkbox"
            checked={formData.hasSerial}
            onChange={(e) => setFormData({...formData, hasSerial: e.target.checked})}
            className="w-4 h-4 text-primary-600 rounded cursor-pointer"
          />
        </div>

        {formData.hasSerial && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Serial / IMEI Numbers (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. SN10001, SN10002, IMEI35824901"
              value={formData.serialNumbers}
              onChange={(e) => setFormData({...formData, serialNumbers: e.target.value})}
              className="input-field text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-[2] btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData?.id ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
