import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Filter, 
  Upload,
  Layers,
  Barcode,
  ArrowRightLeft,
  Calendar,
  Clock,
  Warehouse
} from 'lucide-react';
import { formatCurrency, formatIndianNumber, cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import ProductForm from './ProductForm';
import BulkImport from './BulkImport';
import { Link } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isAdmin, companyId } = useAuth();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, 'products'), 
      where('companyId', '==', companyId)
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const productData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productData);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in ProductList:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteDoc(doc(db, 'products', productToDelete.id));
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Helper to check expiry status (within 30 days or expired)
  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expired', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };
    if (diffDays <= 30) return { label: `Expiring in ${diffDays}d`, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return null;
  };

  const filteredProducts = products.filter(product => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = product.name?.toLowerCase().includes(q) || 
                          product.sku?.toLowerCase().includes(q) ||
                          product.barcode?.toLowerCase().includes(q) ||
                          product.batchNumber?.toLowerCase().includes(q) ||
                          product.brand?.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">Inventory & Stock Master</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage catalog, dual units, batches, expiry alerts, and warehouse godowns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/inventory/barcodes"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Barcode className="w-4 h-4 text-primary-600" />
            <span>Barcodes</span>
          </Link>
          <Link
            to="/inventory/adjustments"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-600" />
            <span>Adjust Stock</span>
          </Link>
          <Link
            to="/inventory/godowns"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Warehouse className="w-4 h-4 text-indigo-600" />
            <span>Godowns</span>
          </Link>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-none bg-gradient-to-br from-primary-600 to-primary-800 text-white p-5">
          <p className="text-primary-100 text-xs font-bold uppercase tracking-wider">Total Products</p>
          <h3 className="text-3xl font-black mt-1">{products.length}</h3>
          <span className="text-[11px] text-primary-200 mt-1 block">Active Catalog Items</span>
        </div>
        <div className="card p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Low Stock Alerts</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-3xl font-black text-amber-500">
              {products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)).length}
            </h3>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Items below threshold</span>
        </div>
        <div className="card p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Out of Stock</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-3xl font-black text-rose-500">
              {products.filter(p => (p.stock || 0) <= 0).length}
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full">Reorder</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Zero stock level</span>
        </div>
        <div className="card p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Stock Value</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(products.reduce((sum, p) => sum + ((p.stock || 0) * (p.buyingPrice || p.sellingPrice || 0)), 0))}
          </h3>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Asset Inventory Valuation</span>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="card overflow-hidden border border-slate-200/80 dark:border-zinc-800/80 p-0 shadow-sm">
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by name, SKU, barcode, brand, batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field py-1.5 px-2.5 text-xs w-auto font-medium"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Product & SKU</th>
                <th className="px-6 py-3.5">Category & Brand</th>
                <th className="px-6 py-3.5">Batch / Expiry</th>
                <th className="px-6 py-3.5">Pricing & GST</th>
                <th className="px-6 py-3.5">Stock Level</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredProducts.map((product) => {
                const expStatus = getExpiryStatus(product.expiryDate);
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{product.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-400 font-mono text-[11px]">
                          <span>SKU: {product.sku || '---'}</span>
                          {product.hsn && <span>• HSN: {product.hsn}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold w-fit">
                          {product.category || 'General'}
                        </span>
                        {product.brand && (
                          <span className="text-[10px] text-slate-400 font-medium">Brand: {product.brand}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.batchNumber || product.expiryDate ? (
                        <div className="flex flex-col gap-1">
                          {product.batchNumber && (
                            <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                              Batch: {product.batchNumber}
                            </span>
                          )}
                          {expStatus ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${expStatus.color}`}>
                              {expStatus.label}
                            </span>
                          ) : product.expiryDate ? (
                            <span className="text-[10px] text-slate-400">Exp: {product.expiryDate}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[11px]">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          Sell: {formatCurrency(product.sellingPrice)}
                        </span>
                        {isAdmin && (
                          <span className="text-[11px] text-slate-400">
                            Buy: {formatCurrency(product.buyingPrice)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          GST: {product.gstPercent || 18}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-black text-sm",
                          product.stock <= 0 
                            ? "text-rose-500" 
                            : product.stock <= (product.lowStockThreshold || 10) 
                              ? "text-amber-500" 
                              : "text-slate-900 dark:text-white"
                        )}>
                          {formatIndianNumber(product.stock || 0)} {product.unit || 'pcs'}
                        </span>
                        {product.secondaryUnit && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            (~{(product.stock / (product.conversionFactor || 1)).toFixed(1)} {product.secondaryUnit})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Product"
      >
        <ProductForm 
          onSuccess={() => setShowAddModal(false)} 
          onCancel={() => setShowAddModal(false)} 
        />
      </Modal>

      <Modal 
        isOpen={!!editingProduct} 
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
      >
        <ProductForm 
          initialData={editingProduct}
          onSuccess={() => setEditingProduct(null)} 
          onCancel={() => setEditingProduct(null)} 
        />
      </Modal>

      <Modal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)}
        title="Bulk Import Products"
      >
        <BulkImport 
          onComplete={() => setShowImportModal(false)} 
          onCancel={() => setShowImportModal(false)} 
        />
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Product Deletion"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl">
            <Trash2 className="w-6 h-6" />
            <p className="text-sm font-medium">
              Are you sure you want to delete <span className="font-bold">"{productToDelete?.name}"</span>? 
              This will permanently remove the product and its data.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-[2] py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95"
            >
              Delete Product
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;
