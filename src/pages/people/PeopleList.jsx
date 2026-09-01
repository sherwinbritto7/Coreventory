import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Plus, 
  Search, 
  User, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2, 
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Printer,
  ShieldAlert,
  Building2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { INDIAN_STATES } from '../../utils/taxEngine';

const PeopleList = ({ type = 'customers' }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [personToDelete, setPersonToDelete] = useState(null);
  const [ledgerParty, setLedgerParty] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const { isAdmin, companyId } = useAuth();

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, type),
      where('companyId', '==', companyId)
    );
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setPeople(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error in PeopleList:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [type, companyId]);

  const handleDeleteClick = (person) => {
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!personToDelete) return;
    try {
      await deleteDoc(doc(db, type, personToDelete.id));
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      setPersonToDelete(null);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  // Open Ledger Statement for a Party
  const handleOpenLedger = async (person) => {
    setLedgerParty(person);
    setShowLedgerModal(true);
    setLedgerLoading(true);

    try {
      const txns = [];

      // 1. Fetch Sales Invoices for customer
      if (type === 'customers') {
        const qSales = query(
          collection(db, 'sales'),
          where('companyId', '==', companyId)
        );
        const sSnap = await getDocs(qSales);
        sSnap.docs.forEach(d => {
          const data = d.data();
          if (data.customerId === person.id || data.customerName?.toLowerCase() === person.name?.toLowerCase()) {
            txns.push({
              date: data.date ? (data.date.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date)) : new Date(),
              type: 'Sales Invoice',
              docNo: data.invoiceNumber || data.invoiceNo || 'INV',
              debit: parseFloat(data.grandTotal || data.total || 0), // Customer owes us (Debit)
              credit: 0,
              mode: data.saleType || 'Due'
            });
          }
        });
      }

      // 2. Fetch Purchase Bills for supplier
      if (type === 'suppliers') {
        const qPur = query(
          collection(db, 'purchases'),
          where('companyId', '==', companyId)
        );
        const pSnap = await getDocs(qPur);
        pSnap.docs.forEach(d => {
          const data = d.data();
          if (data.supplierId === person.id || data.supplierName?.toLowerCase() === person.name?.toLowerCase()) {
            txns.push({
              date: data.date ? (data.date.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date)) : new Date(),
              type: 'Purchase Bill',
              docNo: data.billNumber || data.invoiceNo || 'PUR',
              debit: 0,
              credit: parseFloat(data.grandTotal || data.amount || 0), // We owe supplier (Credit)
              mode: data.paymentMode || 'Credit'
            });
          }
        });
      }

      // 3. Fetch Payment Vouchers
      const qPay = query(
        collection(db, 'payment_vouchers'),
        where('companyId', '==', companyId)
      );
      const paySnap = await getDocs(qPay);
      paySnap.docs.forEach(d => {
        const data = d.data();
        if (data.partyId === person.id || data.partyName?.toLowerCase() === person.name?.toLowerCase()) {
          const isPayIn = (data.voucherType || 'payment_in') === 'payment_in';
          txns.push({
            date: data.date ? new Date(data.date) : new Date(),
            type: isPayIn ? 'Payment Received' : 'Payment Made',
            docNo: data.voucherNo || 'PAY',
            debit: isPayIn ? 0 : parseFloat(data.amount || 0),
            credit: isPayIn ? parseFloat(data.amount || 0) : 0,
            mode: data.paymentMode || 'Cash'
          });
        }
      });

      // Sort chronological
      txns.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate running balance
      let running = 0;
      const computed = txns.map(t => {
        running += (t.debit - t.credit);
        return { ...t, balance: running };
      });

      setLedgerTransactions(computed);
    } catch (err) {
      console.error('Ledger fetch error:', err);
      toast.error('Failed to load ledger transactions');
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredPeople = people.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm) ||
    p.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight capitalize">
            {type === 'customers' ? 'Customer Directory & Receivables' : 'Supplier Directory & Payables'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage parties, GSTIN tax profiles, credit limits, overdue payment terms, and party ledger statements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingPerson(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2 text-xs py-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add {type === 'customers' ? 'Customer' : 'Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search by name, phone, or GSTIN...`}
              className="input-field pl-10 h-10 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Party Details</th>
                <th className="px-6 py-4">Category & State</th>
                <th className="px-6 py-4">Credit Terms</th>
                <th className="px-6 py-4">Total Business</th>
                <th className="px-6 py-4">Outstanding Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPeople.map((person) => {
                const isOverLimit = person.creditLimit && (person.creditBalance || 0) > person.creditLimit;
                return (
                  <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{person.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{person.phone || 'No phone'}</span>
                        {person.gstin && <span className="font-mono text-[10px] text-slate-400 mt-0.5">GSTIN: {person.gstin}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold text-[10px] w-fit">
                          {person.category || 'Retailer'}
                        </span>
                        <span className="text-[10px] text-slate-400">{person.state || 'Same State'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {person.creditPeriodDays ? `${person.creditPeriodDays} Days Due` : 'No Credit Term'}
                        </span>
                        {person.creditLimit ? (
                          <span className={cn(
                            "text-[10px] font-bold mt-0.5",
                            isOverLimit ? "text-rose-500 font-black" : "text-slate-400"
                          )}>
                            Limit: {formatCurrency(person.creditLimit)} {isOverLimit && '⚠️ (Exceeded)'}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(person.totalSpent || person.totalPurchases || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-black text-sm",
                        (person.creditBalance || 0) > 0 ? "text-rose-500" : "text-slate-300 dark:text-slate-600"
                      )}>
                        {formatCurrency(person.creditBalance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Statement Ledger Button */}
                        <button
                          onClick={() => handleOpenLedger(person)}
                          className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold rounded-lg hover:bg-primary-100 text-[11px] flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ledger
                        </button>
                        <button 
                          onClick={() => { setEditingPerson(person); setShowModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteClick(person)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPeople.length === 0 && (
          <div className="px-6 py-16 text-center text-slate-400">
            No {type} found matching your search.
          </div>
        )}
      </div>

      {/* PARTY STATEMENT / LEDGER MODAL */}
      {showLedgerModal && ledgerParty && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Statement of Account: {ledgerParty.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {ledgerParty.phone} {ledgerParty.gstin && `| GSTIN: ${ledgerParty.gstin}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>

            {/* Outstanding Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Current Outstanding Balance</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(ledgerParty.creditBalance || 0)}
                </span>
              </div>
              {ledgerParty.creditLimit && (
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Assigned Credit Limit</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(ledgerParty.creditLimit)}
                  </span>
                </div>
              )}
            </div>

            {/* Transactions Ledger Table */}
            {ledgerLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading ledger entries...</div>
            ) : ledgerTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No transactions recorded with this party yet.</div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Doc / Ref No</th>
                      <th className="py-2.5 px-3">Type & Mode</th>
                      <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                      <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ledgerTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {new Date(t.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-600">
                          {t.docNo}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800 dark:text-white">{t.type}</span>
                          <span className="text-[10px] text-slate-400 block">{t.mode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                          {formatCurrency(t.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PERSON MODAL */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingPerson ? `Edit ${type === 'customers' ? 'Customer' : 'Supplier'}` : `Add New ${type === 'customers' ? 'Customer' : 'Supplier'}`}
      >
        <PersonForm 
          type={type} 
          initialData={editingPerson} 
          onSuccess={() => setShowModal(false)} 
          onCancel={() => setShowModal(false)} 
        />
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl">
            <Trash2 className="w-6 h-6" />
            <p className="text-sm font-medium">
              Are you sure you want to delete <span className="font-bold">"{personToDelete?.name}"</span>? 
              This action cannot be undone.
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
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const PersonForm = ({ type, initialData, onSuccess, onCancel }) => {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    state: 'Maharashtra',
    category: 'Retailer', // Retailer, Wholesaler, Distributor
    creditLimit: 0,
    creditPeriodDays: 30,
    address: '',
    creditBalance: 0,
    ...initialData
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateDoc(doc(db, type, initialData.id), formData);
        toast.success('Updated successfully');
      } else {
        if (!companyId) {
          toast.error("Company ID missing");
          return;
        }
        await addDoc(collection(db, type), { 
          ...formData, 
          companyId,
          createdAt: new Date() 
        });
        toast.success('Added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Party / Business Name *</label>
          <input 
            required 
            className="input-field text-xs" 
            placeholder="e.g. Apex Enterprises or John Doe"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
          <input 
            required 
            className="input-field text-xs"
            placeholder="e.g. 9876543210"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GSTIN (15 Digits)</label>
          <input 
            type="text"
            className="input-field text-xs font-mono"
            placeholder="27AABCU9603R1ZM"
            value={formData.gstin}
            onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State / Place of Supply</label>
          <select
            className="input-field text-xs"
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
          >
            {INDIAN_STATES.map(s => (
              <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
          <select
            className="input-field text-xs font-bold"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="Retailer">Retailer</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credit Limit (₹)</label>
          <input 
            type="number"
            step="0.01"
            className="input-field text-xs font-bold"
            placeholder="0 for unlimited"
            value={formData.creditLimit}
            onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credit Period (Days)</label>
          <input 
            type="number"
            className="input-field text-xs font-bold"
            placeholder="e.g. 30 Days"
            value={formData.creditPeriodDays}
            onChange={(e) => setFormData({...formData, creditPeriodDays: parseInt(e.target.value) || 0})}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Address</label>
        <textarea 
          className="input-field min-h-[60px] text-xs"
          placeholder="Shop / Office / Warehouse address..."
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
      </div>

      <div className="pt-3 flex gap-3 border-t">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex-[2] btn-primary py-2.5 text-xs">
          {loading ? 'Saving...' : 'Save Party Profile'}
        </button>
      </div>
    </form>
  );
};

export default PeopleList;
