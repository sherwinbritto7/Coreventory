import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { 
  Building2, 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  Search, 
  History, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';

const Banking = () => {
  const { companyId, userData } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showContraModal, setShowContraModal] = useState(false);

  // Account Form
  const [accountForm, setAccountForm] = useState({
    accountName: '',
    accountType: 'Bank Account', // 'Bank Account', 'Cash Register', 'Digital Wallet'
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    openingBalance: 0
  });

  // Contra Transfer Form (Inter-account transfer)
  const [contraForm, setContraForm] = useState({
    transferNo: `CNT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    fromAccountId: '',
    fromAccountName: '',
    toAccountId: '',
    toAccountName: '',
    amount: 0,
    type: 'Bank to Cash', // 'Bank to Cash', 'Cash to Bank', 'Bank to Bank'
    notes: ''
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchBankingData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Accounts
        const accSnap = await getDocs(query(collection(db, 'bank_accounts'), where('companyId', '==', companyId)));
        let accList = accSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Ensure default Cash in Hand exists if empty
        if (accList.length === 0) {
          const defaultCash = {
            companyId,
            accountName: 'Cash in Hand (Petty Cash)',
            accountType: 'Cash Register',
            bankName: 'Cash Register',
            accountNumber: 'CASH-001',
            ifscCode: '',
            openingBalance: 10000,
            currentBalance: 10000,
            createdAt: new Date()
          };
          const ref = await addDoc(collection(db, 'bank_accounts'), defaultCash);
          accList = [{ id: ref.id, ...defaultCash }];
        }
        setAccounts(accList);

        // 2. Fetch Contra / Bank transactions
        const tSnap = await getDocs(query(collection(db, 'bank_transactions'), where('companyId', '==', companyId)));
        const tList = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        tList.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setTransactions(tList);
      } catch (err) {
        console.error('Error fetching banking data:', err);
        toast.error('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchBankingData();
  }, [companyId]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.accountName) {
      toast.error('Please enter account name');
      return;
    }

    try {
      setLoading(true);
      const newAcc = {
        ...accountForm,
        companyId,
        currentBalance: parseFloat(accountForm.openingBalance) || 0,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, 'bank_accounts'), newAcc);
      setAccounts(prev => [{ id: docRef.id, ...newAcc }, ...prev]);
      setShowAccountModal(false);
      toast.success('Account added successfully!');
    } catch (err) {
      toast.error('Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContra = async (e) => {
    e.preventDefault();
    const amt = parseFloat(contraForm.amount) || 0;
    if (amt <= 0) {
      toast.error('Please enter a valid transfer amount');
      return;
    }
    if (contraForm.fromAccountId === contraForm.toAccountId) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    try {
      setLoading(true);
      // 1. Deduct from Source Account
      const fromAcc = accounts.find(a => a.id === contraForm.fromAccountId);
      const toAcc = accounts.find(a => a.id === contraForm.toAccountId);

      if (fromAcc) {
        await updateDoc(doc(db, 'bank_accounts', fromAcc.id), {
          currentBalance: (fromAcc.currentBalance || fromAcc.openingBalance || 0) - amt
        });
      }
      if (toAcc) {
        await updateDoc(doc(db, 'bank_accounts', toAcc.id), {
          currentBalance: (toAcc.currentBalance || toAcc.openingBalance || 0) + amt
        });
      }

      // 2. Save Transaction Record
      const contraTx = {
        ...contraForm,
        companyId,
        fromAccountName: fromAcc?.accountName || 'Account',
        toAccountName: toAcc?.accountName || 'Account',
        createdAt: new Date(),
        createdBy: userData?.name || 'Staff'
      };

      const docRef = await addDoc(collection(db, 'bank_transactions'), contraTx);
      setTransactions(prev => [{ id: docRef.id, ...contraTx }, ...prev]);

      // Update local state
      setAccounts(prev => prev.map(a => {
        if (a.id === fromAcc.id) return { ...a, currentBalance: (a.currentBalance || 0) - amt };
        if (a.id === toAcc.id) return { ...a, currentBalance: (a.currentBalance || 0) + amt };
        return a;
      }));

      setShowContraModal(false);
      toast.success('Contra transfer completed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  const totalLiquidCash = accounts.reduce((sum, a) => sum + (parseFloat(a.currentBalance ?? a.openingBalance ?? 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-primary-600" /> Cash Book & Bank Accounts
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage cash registers, current/savings bank accounts, digital wallets, and contra transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setContraForm({
                transferNo: `CNT-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split('T')[0],
                fromAccountId: '',
                fromAccountName: '',
                toAccountId: '',
                toAccountName: '',
                amount: 0,
                type: 'Bank to Cash',
                notes: ''
              });
              setShowContraModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-100 flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" /> Contra Transfer
          </button>
          <button
            onClick={() => {
              setAccountForm({ accountName: '', accountType: 'Bank Account', bankName: '', accountNumber: '', ifscCode: '', openingBalance: 0 });
              setShowAccountModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-xs py-2"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Total Balance Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 border-none">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Liquid Balance</p>
          <h3 className="text-3xl font-black mt-1 text-white">{formatCurrency(totalLiquidCash)}</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Cash in Hand + All Bank Accounts</span>
        </div>

        {accounts.map(acc => (
          <div key={acc.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex items-center justify-between mb-3">
              <span className={`p-2.5 rounded-xl ${
                acc.accountType === 'Cash Register'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
                  : 'bg-primary-50 text-primary-600 dark:bg-primary-900/30'
              }`}>
                {acc.accountType === 'Cash Register' ? <Wallet className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {acc.accountType}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">{acc.accountName}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {acc.accountNumber ? `A/C: ${acc.accountNumber}` : acc.bankName}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">Available:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(acc.currentBalance ?? acc.openingBalance ?? 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Contra Transfers & Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
        <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-4 h-4 text-primary-600" /> Contra Entry & Account Transfers Log
        </h3>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No inter-account transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Voucher No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Transfer Flow</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-primary-600">
                      {t.transferNo}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {t.date}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-white">
                      {t.fromAccountName} <span className="text-slate-400">→</span> {t.toAccountName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-bold text-[10px]">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" /> Add Bank or Cash Account
              </h3>
              <button onClick={() => setShowAccountModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Current A/C or Shop Cash"
                  value={accountForm.accountName}
                  onChange={(e) => setAccountForm({...accountForm, accountName: e.target.value})}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Type</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({...accountForm, accountType: e.target.value})}
                    className="input-field text-xs"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash Register">Cash Register</option>
                    <option value="Digital Wallet">Digital Wallet (UPI/Paytm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.openingBalance}
                    onChange={(e) => setAccountForm({...accountForm, openingBalance: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs font-bold text-right"
                  />
                </div>
              </div>

              {accountForm.accountType === 'Bank Account' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="HDFC, SBI, ICICI"
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm({...accountForm, bankName: e.target.value})}
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="HDFC0001234"
                        value={accountForm.ifscCode}
                        onChange={(e) => setAccountForm({...accountForm, ifscCode: e.target.value})}
                        className="input-field text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account No"
                      value={accountForm.accountNumber}
                      onChange={(e) => setAccountForm({...accountForm, accountNumber: e.target.value})}
                      className="input-field text-xs font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRA TRANSFER MODAL */}
      {showContraModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" /> Contra Entry (Account Transfer)
              </h3>
              <button onClick={() => setShowContraModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateContra} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">From Account (Source) *</label>
                <select
                  required
                  value={contraForm.fromAccountId}
                  onChange={(e) => setContraForm({...contraForm, fromAccountId: e.target.value})}
                  className="input-field text-xs"
                >
                  <option value="">Select source account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName} ({formatCurrency(a.currentBalance ?? a.openingBalance ?? 0)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">To Account (Destination) *</label>
                <select
                  required
                  value={contraForm.toAccountId}
                  onChange={(e) => setContraForm({...contraForm, toAccountId: e.target.value})}
                  className="input-field text-xs"
                >
                  <option value="">Select destination account...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.accountName} ({formatCurrency(a.currentBalance ?? a.openingBalance ?? 0)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={contraForm.amount}
                    onChange={(e) => setContraForm({...contraForm, amount: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs font-bold text-right text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={contraForm.date}
                    onChange={(e) => setContraForm({...contraForm, date: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Type</label>
                <select
                  value={contraForm.type}
                  onChange={(e) => setContraForm({...contraForm, type: e.target.value})}
                  className="input-field text-xs"
                >
                  <option value="Bank to Cash">Cash Withdrawal (Bank to Cash)</option>
                  <option value="Cash to Bank">Cash Deposit (Cash to Bank)</option>
                  <option value="Bank to Bank">Inter-Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowContraModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-2.5 text-xs"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banking;
