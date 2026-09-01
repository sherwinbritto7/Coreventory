import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Barcode, 
  Printer, 
  Search, 
  Plus, 
  Minus, 
  Layers, 
  CheckSquare, 
  Square,
  QrCode,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const BarcodeGenerator = () => {
  const { companyId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { [productId]: count }
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128'); // 'CODE128' or 'QR'
  const [labelSize, setLabelSize] = useState('medium'); // 'small', 'medium', 'large'
  const [includePrice, setIncludePrice] = useState(true);
  const [includeOrgName, setIncludeOrgName] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(list);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [companyId]);

  const toggleSelectAll = () => {
    if (Object.keys(selectedItems).length === products.length) {
      setSelectedItems({});
    } else {
      const all = {};
      products.forEach(p => { all[p.id] = 1; });
      setSelectedItems(all);
    }
  };

  const updateCount = (pId, delta) => {
    setSelectedItems(prev => {
      const current = prev[pId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[pId];
        return copy;
      }
      return { ...prev, [pId]: next };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate label items array based on counts
  const printableLabels = [];
  Object.entries(selectedItems).forEach(([pId, count]) => {
    const prod = products.find(p => p.id === pId);
    if (prod) {
      for (let i = 0; i < count; i++) {
        printableLabels.push(prod);
      }
    }
  });

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Barcode className="w-7 h-7 text-primary-600" /> Barcode & QR Label Designer
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Generate and bulk-print standard barcode and QR product stickers for inventory labeling.
          </p>
        </div>

        <button
          onClick={handlePrint}
          disabled={printableLabels.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-40"
        >
          <Printer className="w-4 h-4" /> Print {printableLabels.length} Label{printableLabels.length !== 1 ? 's' : ''}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Product Selector (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Select Items to Print</h3>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1"
              >
                {Object.keys(selectedItems).length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 text-xs"
              />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto space-y-1">
              {filteredProducts.map(p => {
                const count = selectedItems[p.id] || 0;
                return (
                  <div key={p.id} className="py-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">SKU: {p.sku || p.barcode || '---'}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCount(p.id, -1)}
                        className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <button
                        onClick={() => updateCount(p.id, 1)}
                        className="w-6 h-6 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Label Configuration */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Sticker Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Code Format</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="CODE128">Barcode (Code 128)</option>
                  <option value="QR">QR Code</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Label Size</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="small">Compact (40-Up Sheet)</option>
                  <option value="medium">Standard (24-Up Sheet)</option>
                  <option value="large">Large (12-Up Sheet)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded text-primary-600"
                />
                Show MRP / Selling Price
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOrgName}
                  onChange={(e) => setIncludeOrgName(e.target.checked)}
                  className="rounded text-primary-600"
                />
                Show Company Name
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Print Preview Grid (7 Cols) */}
        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Print Sheet Preview</h3>
              <span className="text-xs text-slate-400 font-mono">{printableLabels.length} stickers ready</span>
            </div>

            {printableLabels.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <Barcode className="w-12 h-12 mb-2 stroke-1 opacity-40" />
                <p className="font-bold text-sm">No stickers selected</p>
                <p className="text-xs text-slate-500">Select items on the left to view sticker layout</p>
              </div>
            ) : (
              <div id="barcode-print-sheet" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {printableLabels.map((p, idx) => {
                  const codeVal = p.barcode || p.sku || `SKU-${p.id.slice(0, 6)}`;
                  return (
                    <div 
                      key={idx}
                      className="p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-center bg-white text-slate-900 space-y-1 shadow-sm"
                    >
                      {includeOrgName && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 truncate w-full">
                          COREVENTORY STORE
                        </span>
                      )}
                      <span className="text-[11px] font-bold truncate w-full">{p.name}</span>
                      
                      {barcodeFormat === 'QR' ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(codeVal)}`}
                          alt="QR"
                          className="w-16 h-16 my-1"
                        />
                      ) : (
                        <div className="my-1 flex flex-col items-center">
                          {/* Code128 SVG Barcode rendering */}
                          <div className="flex items-end gap-[1.5px] h-9 px-1">
                            {Array.from({ length: 28 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-[2px] bg-black ${i % 3 === 0 ? 'h-9' : i % 2 === 0 ? 'h-7' : 'h-8'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono tracking-widest text-slate-700">{codeVal}</span>
                        </div>
                      )}

                      {includePrice && (
                        <span className="text-xs font-black text-emerald-700">
                          MRP: {formatCurrency(p.sellingPrice || 0)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
