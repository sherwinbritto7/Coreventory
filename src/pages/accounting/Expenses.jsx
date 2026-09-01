import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  Filter, 
  DollarSign, 
  Tag, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const Expenses = () => {
  const { companyId, userData } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const expenseCategories = [
    'Rent & Utilities',
    'Electricity & Water',
    'Staff Salaries & Wages',
    'Logistics & Freight',
    'Marketing & Advertising',
    'Office Supplies & Stationary',
    'Repairs & Maintenance',
    'Professional & Legal Fees',
    'Miscellaneous Overheads'
  ];

  const [formData, setFormData] = useState({
    expenseNo: `EXP-${Date.now().toString().slice(-6)}`,
    title: '',
    category: 'Rent & Utilities',
    amount: 0,
    gstPercent: 18,
    isItcEligible: false,
    vendorName: '',
    vendorGSTIN: '',
    paymentMode: 'Cash',
    paidFromAccountId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Expenses
        const qExp = query(collection(db, 'expenses'), where('companyId', '==', companyId));
        const snapExp = await getDocs(qExp);
        const listExp = snapExp.docs.map(d => ({ id: d.id, ...d.data() }));
        listExp.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setExpenses(listExp);

        // Bank / Cash accounts
        const qAcc = query(collection(db, 'bank_accounts'), where('companyId', '==', companyId));
        const snapAcc = await getDocs(qAcc);
        setAccounts(snapAcc.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      setLoading(true);
      const newExp = {
        ...formData,
        amount: amt,
        companyId,
        createdAt: new Date(),
        createdBy: userData?.name || 'Staff'
      };

      const docRef = await addDoc(collection(db, 'expenses'), newExp);
      setExpenses(prev => [{ id: docRef.id, ...newExp }, ...prev]);
      setShowModal(false);
      toast.success('Expense recorded successfully!');
    } catch (err) {
      toast.error('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Expense removed');
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const itcEligibleAmount = expenses.filter(e => e.isItcEligible).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || e.title?.toLowerCase().includes(q) || e.vendorName?.toLowerCase().includes(q) || e.expenseNo?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Receipt className="w-7 h-7 text-rose-600" /> Expense Tracker & Overhead Costs
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Log direct & indirect operational expenses with GST Input Tax Credit (ITC) tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              expenseNo: `EXP-${Date.now().toString().slice(-6)}`,
              title: '',
              category: 'Rent & Utilities',
              amount: 0,
              gstPercent: 18,
              isItcEligible: false,
              vendorName: '',
              vendorGSTIN: '',
              paymentMode: 'Cash',
              paidFromAccountId: '',
              date: new Date().toISOString().split('T')[0],
              notes: ''
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-rose-500 to-rose-700 text-white border-none">
          <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Total Expenses</p>
          <h3 className="text-3xl font-black mt-1">{formatCurrency(totalExpenseAmount)}</h3>
          <span className="text-[11px] text-rose-100 mt-1 block">{expenses.length} Records Logged</span>
        </div>

        <div className="card p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Eligible for GST ITC</p>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(itcEligibleAmount)}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Qualifies for Tax Input Credit Claim</span>
        </div>

        <div className="card p-5">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Top Expense Head</p>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {expenses[0]?.category || 'General Overheads'}
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Active Category</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by title, vendor, code..."
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field text-xs font-bold"
          >
            <option value="All">All Categories</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <Receipt className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No expenses found</p>
            <p className="text-xs text-slate-500 mt-1">Record overhead expenses to keep your P&L accurate</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Expense No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title & Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">GST / ITC</th>
                  <th className="py-3 px-4">Paid Via</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      {exp.expenseNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 dark:text-white">{exp.title}</p>
                      {exp.vendorName && <p className="text-[11px] text-slate-400">{exp.vendorName}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {exp.isItcEligible ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded font-bold text-[10px]">
                          ITC Claimable ({exp.gstPercent || 18}%)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No ITC</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {exp.paymentMode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-600" /> Record Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Electricity Bill Feb 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-field text-xs"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                    className="input-field text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isItcEligible}
                    onChange={(e) => setFormData({...formData, isItcEligible: e.target.checked})}
                    className="rounded text-primary-600"
                  />
                  GST Input Tax Credit (ITC) Eligible
                </label>

                {formData.isItcEligible && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Vendor GSTIN</label>
                      <input
                        type="text"
                        placeholder="27AABCU9603R1ZM"
                        value={formData.vendorGSTIN}
                        onChange={(e) => setFormData({...formData, vendorGSTIN: e.target.value})}
                        className="input-field text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">GST Rate (%)</label>
                      <select
                        value={formData.gstPercent}
                        onChange={(e) => setFormData({...formData, gstPercent: parseInt(e.target.value) || 18})}
                        className="input-field text-xs font-bold"
                      >
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                  </div>
                )}
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
