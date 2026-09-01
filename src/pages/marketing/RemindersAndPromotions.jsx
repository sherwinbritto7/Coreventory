import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  Tag, 
  Gift, 
  Sparkles, 
  QrCode, 
  Percent, 
  Plus, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { generateUPIString } from '../../utils/taxEngine';

const RemindersAndPromotions = () => {
  const { companyId } = useAuth();
  const [activeTab, setActiveTab] = useState('reminders'); // 'reminders' or 'coupons'
  const [customers, setCustomers] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reminder Generator State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [reminderAmount, setReminderAmount] = useState(0);

  // New Coupon Form
  const [couponForm, setCouponForm] = useState({
    code: 'SAVE10',
    discountType: 'percentage', // 'percentage' or 'flat'
    discountValue: 10,
    minOrderValue: 500,
    expiryDate: '2026-12-31',
    isActive: true
  });

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Company
        const cSnap = await getDoc(doc(db, 'companies', companyId));
        if (cSnap.exists()) setCompanyProfile(cSnap.data());

        // Customers with dues
        const custSnap = await getDocs(query(collection(db, 'customers'), where('companyId', '==', companyId)));
        const custList = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(custList);

        // Coupons
        const coupSnap = await getDocs(query(collection(db, 'promotions'), where('companyId', '==', companyId)));
        setCoupons(coupSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  // Select customer to prefill reminder message
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    const due = customer.creditBalance || 0;
    setReminderAmount(due);

    const upiLink = companyProfile?.upiId 
      ? generateUPIString({
          upiId: companyProfile.upiId,
          payeeName: companyProfile.companyName,
          amount: due,
          note: `Due Settlement for ${customer.name}`
        })
      : '';

    let text = `Dear ${customer.name},\n\n`;
    text += `This is a gentle payment reminder from *${companyProfile?.companyName || 'Coreventory Business'}* regarding your pending ledger balance of *${formatCurrency(due)}*.\n\n`;
    if (companyProfile?.upiId) {
      text += `💳 *Pay Online via UPI:* ${companyProfile.upiId}\n`;
      text += `Quick Pay Link: ${upiLink}\n\n`;
    }
    text += `Please settle the amount at your earliest convenience. Thank you for your business!`;
    setCustomMessage(text);
  };

  const handleSendWhatsApp = () => {
    if (!selectedCustomer?.phone) {
      toast.error('Customer phone number missing');
      return;
    }
    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp link opened!');
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newCoupon = {
        ...couponForm,
        companyId,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, 'promotions'), newCoupon);
      setCoupons(prev => [{ id: docRef.id, ...newCoupon }, ...prev]);
      toast.success('Promotional coupon created!');
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500,
        expiryDate: '2026-12-31',
        isActive: true
      });
    } catch (err) {
      toast.error('Failed to create coupon');
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
            <MessageSquare className="w-7 h-7 text-emerald-600" /> WhatsApp Reminders & Promotions
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Automated WhatsApp payment reminders with UPI QR intent links and promotional discount schemes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('reminders')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reminders'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Send className="w-4 h-4" /> WhatsApp Payment Reminders
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'coupons'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Gift className="w-4 h-4" /> Discount Coupons & Schemes
        </button>
      </div>

      {/* TAB 1: WHATSAPP PAYMENT REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="grid grid-cols-12 gap-6">
          
          {/* Customers with Overdue List (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">
              Customers with Pending Dues
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[450px] overflow-y-auto space-y-1">
              {customers.filter(c => (c.creditBalance || 0) > 0).map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                    selectedCustomer?.id === c.id 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{c.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{c.phone || 'No phone'}</span>
                  </div>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(c.creditBalance)}
                  </span>
                </button>
              ))}

              {customers.filter(c => (c.creditBalance || 0) > 0).length === 0 && (
                <p className="p-8 text-center text-slate-400 text-xs font-bold">No customers with pending dues!</p>
              )}
            </div>
          </div>

          {/* WhatsApp Message Preview & Dispatch (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> WhatsApp Message Generator
            </h3>

            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Selected Recipient</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{selectedCustomer.name} ({selectedCustomer.phone})</strong>
                  </div>
                  <span className="text-base font-black text-rose-600">{formatCurrency(reminderAmount)}</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Editable WhatsApp Message Template
                  </label>
                  <textarea
                    rows={8}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                </div>

                {companyProfile?.upiId && (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Direct UPI Intent Active</span>
                        <p className="text-[11px] text-slate-500">Includes direct payment link to {companyProfile.upiId}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Open in WhatsApp & Send Reminder
                </button>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-2 stroke-1 opacity-40" />
                <p className="font-bold text-sm">Select a customer on the left</p>
                <p className="text-xs text-slate-500">Pre-formats reminder text with live UPI payment link</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: PROMOTIONS & DISCOUNT COUPONS */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Create Coupon Form (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary-600" /> Create Discount Coupon
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20 or FESTIVE500"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  className="input-field text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})}
                    className="input-field text-xs font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({...couponForm, discountValue: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs font-bold text-primary-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderValue}
                    onChange={(e) => setCouponForm({...couponForm, minOrderValue: parseFloat(e.target.value) || 0})}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-xs mt-2"
              >
                Create Promotional Coupon
              </button>
            </form>
          </div>

          {/* Active Coupons List (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Active Promotional Codes</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map(cp => (
                <div key={cp.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative space-y-2">
                  <span className="font-mono font-black text-primary-600 text-sm tracking-wider block">
                    {cp.code}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {cp.discountType === 'percentage' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} FLAT OFF`}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Min Order: {formatCurrency(cp.minOrderValue || 0)}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Valid till: {cp.expiryDate || 'No Expiry'}
                  </span>
                </div>
              ))}

              {coupons.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                  No promotional coupons created yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersAndPromotions;
