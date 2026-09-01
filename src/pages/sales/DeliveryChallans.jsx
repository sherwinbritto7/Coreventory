import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { 
  Truck, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Trash2, 
  Printer, 
  Eye, 
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const DeliveryChallans = () => {
  const { companyId, userData } = useAuth();
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    challanNo: `DC-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    vehicleNo: '',
    driverName: '',
    notes: '',
    items: [{ productId: '', name: '', qty: 1, unit: 'pcs' }]
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchChallans = async () => {
      try {
        setLoading(true);
        // Products for dropdown
        const prodSnap = await getDocs(query(collection(db, 'products'), where('companyId', '==', companyId)));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Challans
        const q = query(
          collection(db, 'challans'),
          where('companyId', '==', companyId)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setChallans(list);
      } catch (err) {
        console.error('Error fetching challans:', err);
        toast.error('Failed to load delivery challans');
      } finally {
        setLoading(false);
      }
    };

    fetchChallans();
  }, [companyId]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', qty: 1, unit: 'pcs' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        items[index] = {
          ...items[index],
          productId: value,
          name: prod?.name || '',
          unit: prod?.unit || 'pcs',
          price: prod?.sellingPrice || 0
        };
      } else {
        items[index][field] = value;
      }
      return { ...prev, items };
    });
  };

  const handleCreateChallan = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (formData.items.length === 0 || !formData.items[0].name) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      const newChallan = {
        ...formData,
        companyId,
        status: 'Dispatched', // 'Dispatched', 'Delivered', 'Invoiced'
        createdAt: new Date(),
        createdBy: userData?.name || 'Staff'
      };

      const docRef = await addDoc(collection(db, 'challans'), newChallan);
      setChallans(prev => [{ id: docRef.id, ...newChallan }, ...prev]);
      setShowCreateModal(false);
      toast.success('Delivery Challan created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save challan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'challans', id), { status: newStatus });
      setChallans(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleConvertToInvoice = (challan) => {
    // Navigate to Sales Entry with pre-filled state
    navigate('/sales/new', { 
      state: { 
        convertedChallan: challan 
      } 
    });
  };

  const filteredChallans = challans.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      c.challanNo?.toLowerCase().includes(q) || 
      c.customerName?.toLowerCase().includes(q) ||
      c.vehicleNo?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Truck className="w-7 h-7 text-primary-600" /> Delivery Challans & Dispatches
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Record dispatches, transport packing slips, and convert to sales invoices.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              challanNo: `DC-${Date.now().toString().slice(-6)}`,
              date: new Date().toISOString().split('T')[0],
              customerName: '',
              customerPhone: '',
              deliveryAddress: '',
              vehicleNo: '',
              driverName: '',
              notes: '',
              items: [{ productId: '', name: '', qty: 1, unit: 'pcs' }]
            });
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Delivery Challan
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Challan No, Customer, Vehicle..."
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'Dispatched', 'Delivered', 'Invoiced'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-medium">Loading challans...</div>
        ) : filteredChallans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Truck className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No delivery challans recorded</p>
            <p className="text-xs text-slate-500 mt-1">Create a challan to record outgoing goods dispatch</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Challan No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle & Driver</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredChallans.map(ch => (
                  <tr key={ch.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {ch.challanNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {ch.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {ch.customerName}
                      {ch.customerPhone && (
                        <span className="block text-[11px] font-normal text-slate-400">{ch.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {ch.vehicleNo || 'Self'}
                      {ch.driverName && <span className="block text-[10px] text-slate-400">{ch.driverName}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {ch.items?.length || 0} Products
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ch.status === 'Invoiced' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : ch.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {ch.status !== 'Invoiced' && (
                        <button
                          onClick={() => handleConvertToInvoice(ch)}
                          className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold rounded-lg hover:bg-primary-100 text-[11px] inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Convert to Invoice
                        </button>
                      )}
                      {ch.status === 'Dispatched' && (
                        <button
                          onClick={() => handleUpdateStatus(ch.id, 'Delivered')}
                          className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 text-[11px] inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CHALLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-600" /> New Delivery Challan
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateChallan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Challan No *</label>
                  <input
                    type="text"
                    required
                    value={formData.challanNo}
                    onChange={(e) => setFormData({...formData, challanNo: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Vehicle No</label>
                  <input
                    type="text"
                    placeholder="MH-04-AB-1234"
                    value={formData.vehicleNo}
                    onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer / Consignee *</label>
                  <input
                    type="text"
                    required
                    placeholder="Customer or Store Name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone / Mobile</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Delivery Destination Address</label>
                <input
                  type="text"
                  placeholder="Delivery address / warehouse location"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-400">Items / Goods to Dispatch</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-primary-600 font-bold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="input-field flex-1 text-xs"
                    >
                      <option value="">Select Item</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                      className="input-field w-20 text-xs text-center font-bold"
                    />

                    <input
                      type="text"
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="input-field w-16 text-xs text-center"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={formData.items.length === 1}
                      className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
                  Create Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChallans;
