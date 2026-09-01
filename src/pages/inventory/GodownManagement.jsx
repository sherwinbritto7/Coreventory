import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  Warehouse, 
  Plus, 
  ArrowRight, 
  ArrowRightLeft, 
  Search, 
  MapPin, 
  Package, 
  History,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const GodownManagement = () => {
  const { companyId, userData } = useAuth();
  const [godowns, setGodowns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGodownModal, setShowGodownModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Godown Form
  const [godownForm, setGodownForm] = useState({
    name: '',
    location: '',
    managerName: '',
    contactPhone: '',
    notes: ''
  });

  // Transfer Voucher Form
  const [transferForm, setTransferForm] = useState({
    transferNo: `TR-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    sourceGodownId: 'main',
    sourceGodownName: 'Main Store / Floor',
    destGodownId: '',
    destGodownName: '',
    productId: '',
    productName: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Godowns
        const gSnap = await getDocs(query(collection(db, 'godowns'), where('companyId', '==', companyId)));
        const gList = gSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGodowns(gList);

        // 2. Fetch Products
        const pSnap = await getDocs(query(collection(db, 'products'), where('companyId', '==', companyId)));
        const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(pList);

        // 3. Fetch Transfers
        const tSnap = await getDocs(query(collection(db, 'godown_transfers'), where('companyId', '==', companyId)));
        const tList = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        tList.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setTransfers(tList);
      } catch (err) {
        console.error('Error fetching godown data:', err);
        toast.error('Failed to load godowns');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleCreateGodown = async (e) => {
    e.preventDefault();
    if (!godownForm.name) {
      toast.error('Please enter godown name');
      return;
    }

    try {
      setLoading(true);
      const newGodown = {
        ...godownForm,
        companyId,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, 'godowns'), newGodown);
      setGodowns(prev => [{ id: docRef.id, ...newGodown }, ...prev]);
      setShowGodownModal(false);
      toast.success('Godown created successfully!');
    } catch (err) {
      toast.error('Failed to add godown');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.productId) {
      toast.error('Please select product');
      return;
    }
    if (!transferForm.destGodownId) {
      toast.error('Please select destination godown');
      return;
    }
    if (transferForm.sourceGodownId === transferForm.destGodownId) {
      toast.error('Source and Destination godowns must be different');
      return;
    }

    try {
      setLoading(true);
      const transferRecord = {
        ...transferForm,
        companyId,
        status: 'Completed',
        transferredBy: userData?.name || 'Warehouse Staff',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'godown_transfers'), transferRecord);
      setTransfers(prev => [{ id: docRef.id, ...transferRecord }, ...prev]);
      setShowTransferModal(false);
      toast.success('Stock transfer voucher generated and logged!');
    } catch (err) {
      toast.error('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Warehouse className="w-7 h-7 text-indigo-600" /> Multi-Godown & Branch Warehouses
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage physical warehouses, storage godowns, and inter-branch stock transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTransferForm({
                transferNo: `TR-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split('T')[0],
                sourceGodownId: 'main',
                sourceGodownName: 'Main Store / Floor',
                destGodownId: '',
                destGodownName: '',
                productId: '',
                productName: '',
                quantity: 1,
                notes: ''
              });
              setShowTransferModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs hover:bg-indigo-100 flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
          </button>
          <button
            onClick={() => {
              setGodownForm({ name: '', location: '', managerName: '', contactPhone: '', notes: '' });
              setShowGodownModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-xs py-2"
          >
            <Plus className="w-4 h-4" /> Add Godown
          </button>
        </div>
      </div>

      {/* Godowns Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Default Main Store */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Warehouse className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-black uppercase rounded-full">
              Primary Location
            </span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Main Store / Shop Floor</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" /> Primary Retail & Billing Location
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-500">
            <span>Allocated Items:</span>
            <span className="text-slate-900 dark:text-white">{products.length} Products</span>
          </div>
        </div>

        {godowns.map(g => (
          <div key={g.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                <Warehouse className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-slate-400">
                {g.managerName ? `Mgr: ${g.managerName}` : 'Branch'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{g.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {g.location || 'Warehouse Location'}
            </p>
            {g.contactPhone && (
              <p className="text-[11px] text-slate-400 mt-1">Ph: {g.contactPhone}</p>
            )}
          </div>
        ))}
      </div>

      {/* Inter-Godown Stock Transfer Vouchers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3 p-4">
        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-primary-600" /> Inter-Godown Stock Transfer Log
        </h3>

        {transfers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No stock transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Transfer Voucher</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Source → Destination</th>
                  <th className="py-3 px-3">Product Transferred</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Transferred By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                      {tr.transferNo}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {tr.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-white">
                      {tr.sourceGodownName} <span className="text-slate-400">→</span> {tr.destGodownName}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {tr.productName}
                    </td>
                    <td className="py-3 px-3 font-black text-center text-slate-900 dark:text-white">
                      {tr.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {tr.transferredBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE GODOWN MODAL */}
      {showGodownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-indigo-600" /> Add New Godown / Branch
              </h3>
              <button onClick={() => setShowGodownModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateGodown} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Godown / Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Warehouse or Branch 2"
                  value={godownForm.name}
                  onChange={(e) => setGodownForm({...godownForm, name: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Physical Location / Address</label>
                <input
                  type="text"
                  placeholder="Street / Industrial Area / City"
                  value={godownForm.location}
                  onChange={(e) => setGodownForm({...godownForm, location: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Manager / In-charge</label>
                  <input
                    type="text"
                    placeholder="Staff Name"
                    value={godownForm.managerName}
                    onChange={(e) => setGodownForm({...godownForm, managerName: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={godownForm.contactPhone}
                    onChange={(e) => setGodownForm({...godownForm, contactPhone: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowGodownModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Save Godown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Stock Transfer Voucher
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer No</label>
                  <input
                    type="text"
                    required
                    value={transferForm.transferNo}
                    onChange={(e) => setTransferForm({...transferForm, transferNo: e.target.value})}
                    className="input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={transferForm.date}
                    onChange={(e) => setTransferForm({...transferForm, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Source Godown (From)</label>
                <select
                  value={transferForm.sourceGodownId}
                  onChange={(e) => {
                    const selected = e.target.value === 'main' ? 'Main Store / Floor' : godowns.find(g => g.id === e.target.value)?.name;
                    setTransferForm({
                      ...transferForm,
                      sourceGodownId: e.target.value,
                      sourceGodownName: selected
                    });
                  }}
                  className="input-field text-xs"
                >
                  <option value="main">Main Store / Floor</option>
                  {godowns.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Destination Godown (To) *</label>
                <select
                  required
                  value={transferForm.destGodownId}
                  onChange={(e) => {
                    const selected = e.target.value === 'main' ? 'Main Store / Floor' : godowns.find(g => g.id === e.target.value)?.name;
                    setTransferForm({
                      ...transferForm,
                      destGodownId: e.target.value,
                      destGodownName: selected
                    });
                  }}
                  className="input-field text-xs"
                >
                  <option value="">Select Destination...</option>
                  <option value="main">Main Store / Floor</option>
                  {godowns.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Product *</label>
                  <select
                    required
                    value={transferForm.productId}
                    onChange={(e) => {
                      const prod = products.find(p => p.id === e.target.value);
                      setTransferForm({
                        ...transferForm,
                        productId: e.target.value,
                        productName: prod?.name || ''
                      });
                    }}
                    className="input-field text-xs"
                  >
                    <option value="">Choose item...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 1})}
                    className="input-field text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Transfer Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodownManagement;
