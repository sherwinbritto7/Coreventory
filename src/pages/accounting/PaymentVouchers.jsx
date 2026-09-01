import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Receipt, 
  CheckCircle2, 
  User, 
  Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const PaymentVouchers = () => {
  const { companyId, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('payment_in'); // 'payment_in' or 'payment_out'
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    voucherType: 'payment_in', // 'payment_in' (Customer) or 'payment_out' (Supplier)
    voucherNo: `REC-${Date.now().toString().slice(-6)}`,
    partyId: '',
    partyName: '',
    amount: 0,
    paymentMode: 'Cash',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    referenceNo: '',
    notes: ''
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Payment vouchers
        const qPay = query(collection(db, 'payment_vouchers'), where('companyId', '==', companyId));
        const snapPay = await getDocs(qPay);
        const listPay = snapPay.docs.map(d => ({ id: d.id, ...d.data() }));
        listPay.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setPayments(listPay);

        // 2. Parties
        const qParties = query(collection(db, 'people'), where('companyId', '==', companyId));
        const snapParties = await getDocs(qParties);
        setParties(snapParties.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Accounts
        const qAcc = query(collection(db, 'bank_accounts'), where('companyId', '==', companyId));
        const snapAcc = await getDocs(qAcc);
        setAccounts(snapAcc.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load payment vouchers');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.partyName) {
      toast.error('Please select or specify party');
      return;
    }

    try {
      setLoading(true);
      const newVoucher = {
        ...formData,
        amount: amt,
        companyId,
        createdAt: new Date(),
        recordedBy: userData?.name || 'Staff'
      };

      // 1. Save Voucher
      const docRef = await addDoc(collection(db, 'payment_vouchers'), newVoucher);

      // 2. Adjust Party Outstanding Balance
      if (formData.partyId) {
        const partyRef = doc(db, 'people', formData.partyId);
        const partySnap = await getDoc(partyRef);
        if (partySnap.exists()) {
          const currentCredit = partySnap.data().creditBalance || 0;
          // For Payment In (Customer paid us) -> decrease customer credit balance
          // For Payment Out (We paid supplier) -> decrease supplier payable balance
          const newBalance = Math.max(0, currentCredit - amt);
          await updateDoc(partyRef, { creditBalance: newBalance });
        }
      }

      // 3. Adjust Bank/Cash account if selected
      if (formData.accountId) {
        const accRef = doc(db, 'bank_accounts', formData.accountId);
        const accSnap = await getDoc(accRef);
        if (accSnap.exists()) {
          const curAccBal = accSnap.data().currentBalance || 0;
          const delta = formData.voucherType === 'payment_in' ? amt : -amt;
          await updateDoc(accRef, { currentBalance: curAccBal + delta });
        }
      }

      setPayments(prev => [{ id: docRef.id, ...newVoucher }, ...prev]);
      setShowModal(false);
      toast.success(`${formData.voucherType === 'payment_in' ? 'Payment In (Receipt)' : 'Payment Out'} saved!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save payment voucher');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesTab = (p.voucherType || 'payment_in') === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.partyName?.toLowerCase().includes(q) || p.voucherNo?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const totalIn = payments.filter(p => (p.voucherType || 'payment_in') === 'payment_in').reduce((s, p) => s + (p.amount || 0), 0);
  const totalOut = payments.filter(p => p.voucherType === 'payment_out').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-600" /> Payment In & Out Vouchers
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Record customer settlements (Payment In) and vendor payouts (Payment Out) to settle ledger balances.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              voucherType: activeTab,
              voucherNo: `${activeTab === 'payment_in' ? 'REC' : 'PAY'}-${Date.now().toString().slice(-6)}`,
              partyId: '',
              partyName: '',
              amount: 0,
              paymentMode: 'Cash',
              accountId: '',
              date: new Date().toISOString().split('T')[0],
              referenceNo: '',
              notes: ''
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Record {activeTab === 'payment_in' ? 'Payment In (Receipt)' : 'Payment Out (Payout)'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('payment_in')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'payment_in'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          Payment In (Customer Receipts: {formatCurrency(totalIn)})
        </button>
        <button
          onClick={() => setActiveTab('payment_out')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'payment_out'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-500" />
          Payment Out (Supplier Payouts: {formatCurrency(totalOut)})
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
            placeholder="Search voucher no, party name..."
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Receipt className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No {activeTab === 'payment_in' ? 'receipts' : 'payouts'} recorded</p>
            <p className="text-xs text-slate-500 mt-1">Record payments to update party balance and cash register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Reference / Txn ID</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600">
                      {p.voucherNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {p.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {p.partyName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[10px]">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {p.referenceNo || '---'}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black text-sm ${
                      activeTab === 'payment_in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PAYMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Record {formData.voucherType === 'payment_in' ? 'Payment In (Receipt)' : 'Payment Out (Payout)'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Voucher No</label>
                  <input
                    type="text"
                    required
                    value={formData.voucherNo}
                    onChange={(e) => setFormData({...formData, voucherNo: e.target.value})}
                    className="input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Party *</label>
                <select
                  value={formData.partyId}
                  onChange={(e) => {
                    const party = parties.find(p => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      partyId: e.target.value,
                      partyName: party?.name || ''
                    });
                  }}
                  className="input-field text-xs font-bold"
                >
                  <option value="">Select party...</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.type === 'customers' ? 'Customer' : 'Supplier'} - Due: {formatCurrency(p.creditBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                    className="input-field text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Deposit Into / Paid From Account</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                  className="input-field text-xs"
                >
                  <option value="">Default Account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName} ({formatCurrency(a.currentBalance || 0)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Reference / Cheque / UTR No</label>
                <input
                  type="text"
                  placeholder="e.g. UTR12345678 or Cheque #1029"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({...formData, referenceNo: e.target.value})}
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
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVouchers;
