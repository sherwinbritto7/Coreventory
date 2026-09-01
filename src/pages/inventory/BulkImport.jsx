import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const BulkImport = ({ onComplete, onCancel }) => {
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const downloadSample = () => {
    const csv = Papa.unparse([
      {
        "Product Name": "Example Product",
        "SKU/Code": "EX-101",
        "Category": "Electronics",
        "Unit": "pcs",
        "Buying Price": "1000",
        "Selling Price": "1500",
        "GST %": "18",
        "Stock Quantity": "50",
        "Low Stock Threshold": "10"
      }
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory_sample.csv';
    link.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateData(results.data);
      }
    });
  };

  const validateData = (rows) => {
    const validatedData = [];
    const validationErrors = [];

    rows.forEach((row, index) => {
      const error = {};
      if (!row["Product Name"]) error.name = "Missing Name";
      if (!row["SKU/Code"]) error.sku = "Missing SKU";
      
      const sellingPrice = parseFloat(row["Selling Price"]);
      const buyingPrice = parseFloat(row["Buying Price"]);
      
      if (isNaN(sellingPrice)) error.sellingPrice = "Invalid Price";
      if (isNaN(buyingPrice)) error.buyingPrice = "Invalid Price";

      validatedData.push({
        name: row["Product Name"],
        sku: row["SKU/Code"],
        category: row["Category"] || 'Others',
        unit: row["Unit"] || 'pcs',
        buyingPrice: buyingPrice || 0,
        sellingPrice: sellingPrice || 0,
        gstPercent: parseInt(row["GST %"]) || 18,
        stock: parseInt(row["Stock Quantity"]) || 0,
        lowStockThreshold: parseInt(row["Low Stock Threshold"]) || 10,
        error: Object.keys(error).length > 0 ? error : null
      });

      if (Object.keys(error).length > 0) {
        validationErrors.push({ row: index + 1, error });
      }
    });

    setData(validatedData);
    setErrors(validationErrors);
  };

  const handleImport = async () => {
    const validRows = data.filter(d => !d.error);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      validRows.forEach(row => {
        const productRef = doc(collection(db, 'products'));
        const { error, ...productData } = row;
        batch.set(productRef, { ...productData, createdAt: new Date() });
      });
      await batch.commit();
      toast.success(`Successfully imported ${validRows.length} products`);
      onComplete();
    } catch (error) {
      toast.error('Failed to import products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary-600 rounded-lg text-white">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Sample CSV Template</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Download and use this format for bulk upload.</p>
          </div>
        </div>
        <button 
          onClick={downloadSample}
          className="px-4 py-2 bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 text-sm font-bold rounded-xl border border-primary-100 dark:border-primary-900/20 hover:bg-white/50 transition-colors shadow-sm"
        >
          Download Sample
        </button>
      </div>

      {!data.length ? (
        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors hover:border-primary-500 group">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            id="csv-upload"
          />
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Upload your CSV file</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs"> Drag and drop or click to browse files from your computer.</p>
          <label htmlFor="csv-upload" className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold cursor-pointer transition-all active:scale-95 z-20">
            Browse Files
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-2">
              Preview Data ({data.length} rows)
              {errors.length > 0 && <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-bold">{errors.length} errors</span>}
            </h4>
            <button onClick={() => setData([])} className="text-sm text-red-500 font-medium">Clear</button>
          </div>

          <div className="max-h-[400px] overflow-auto border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 shadow-sm">
                <tr>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400">Sku</th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Selling ₹</th>
                  <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((row, i) => (
                  <tr key={i} className={row.error ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"}>
                    <td className="p-3">
                      {row.error ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{row.name || <span className="text-red-500 font-bold">MISSING</span>}</td>
                    <td className="p-3 font-medium text-slate-500">{row.sku || <span className="text-red-500 font-bold">MISSING</span>}</td>
                    <td className="p-3 text-slate-500 text-xs font-bold uppercase">{row.category}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{row.sellingPrice}</td>
                    <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={loading || data.filter(d => !d.error).length === 0}
              className="flex-[2] btn-primary flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Import ${data.filter(d => !d.error).length} Valid Products`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
