import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { 
  Building2, 
  Settings as SettingsIcon, 
  MapPin, 
  Phone, 
  Globe, 
  Image as ImageIcon,
  Loader2,
  Save,
  Link as LinkIcon,
  Download,
  Upload,
  Database,
  Printer,
  QrCode,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserManagement from './UserManagement';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { INDIAN_STATES } from '../../utils/taxEngine';
import { seedMockData } from '../../utils/mockDataLoader';
import { Sparkles } from 'lucide-react';

const Settings = () => {
  const { companyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'tax_bank', 'backup', 'users'
  const [backupLoading, setBackupLoading] = useState(false);

  const [profile, setProfile] = useState({
    businessName: '',
    companyName: '',
    gstin: '',
    state: 'Maharashtra',
    gstScheme: 'Regular', // 'Regular' or 'Composition'
    reverseChargeDefault: false,
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    pincode: '400001',
    website: '',
    logoURL: '',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    defaultPrintTemplate: 'thermal', // 'thermal' or 'a4'
    terms: '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.\n3. Payment due within specified credit period.'
  });

  useEffect(() => {
    if (companyId) {
      fetchProfile();
    }
  }, [companyId]);

  const fetchProfile = async () => {
    if (!companyId) return;
    try {
      // Check settings doc or company doc
      const docSnap = await getDoc(doc(db, 'settings', companyId));
      if (docSnap.exists()) {
        setProfile(prev => ({ ...prev, ...docSnap.data() }));
      } else {
        const compSnap = await getDoc(doc(db, 'companies', companyId));
        if (compSnap.exists()) {
          setProfile(prev => ({ ...prev, ...compSnap.data(), businessName: compSnap.data().companyName }));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        ...profile,
        companyName: profile.businessName || profile.companyName,
        companyId
      };
      await setDoc(doc(db, 'settings', companyId), dataToSave);
      await setDoc(doc(db, 'companies', companyId), dataToSave, { merge: true });
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Full Database JSON Backup Export
  const handleExportBackup = async () => {
    if (!companyId) return;
    try {
      setBackupLoading(true);
      const collectionsToBackup = [
        'products',
        'sales',
        'purchases',
        'customers',
        'suppliers',
        'expenses',
        'bank_accounts',
        'challans',
        'returns_notes',
        'stock_adjustments',
        'godowns',
        'promotions',
        'online_orders'
      ];

      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        companyId,
        companyProfile: profile,
        data: {}
      };

      for (const colName of collectionsToBackup) {
        const q = query(collection(db, colName), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        backupData.data[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `Coreventory_Backup_${profile.businessName || 'Company'}_${new Date().toISOString().slice(0, 10)}.json`);
      dlAnchor.click();
      toast.success('Full database backup exported!');
    } catch (err) {
      console.error(err);
      toast.error('Backup export failed');
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore Database from JSON
  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setBackupLoading(true);
        const importedJson = JSON.parse(event.target.result);
        if (!importedJson.data) {
          toast.error('Invalid backup JSON format');
          return;
        }

        if (!window.confirm('Are you sure you want to restore data from this backup?')) return;

        // Restore collections
        for (const [colName, items] of Object.entries(importedJson.data)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              const { id, ...itemData } = item;
              await setDoc(doc(db, colName, id), {
                ...itemData,
                companyId
              }, { merge: true });
            }
          }
        }

        toast.success('Database restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse and restore backup');
      } finally {
        setBackupLoading(false);
      }
    };
    reader.readAsText(file);
  };

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Settings & System Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure GST profile, UPI bank details, thermal receipt defaults, data backup, and staff roles.
          </p>
        </div>
        {activeTab !== 'users' && (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit gap-1 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'profile' ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Company Profile
        </button>
        <button 
          onClick={() => setActiveTab('tax_bank')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'tax_bank' ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          GST & Bank Details
        </button>
        <button 
          onClick={() => setActiveTab('backup')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'backup' ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Backup & Restore
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'users' ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Staff & Access
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building2 className="w-5 h-5 text-primary-600" /> Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company / Shop Name *</label>
                  <input 
                    className="input-field text-xs" 
                    value={profile.businessName}
                    onChange={(e) => setProfile({...profile, businessName: e.target.value})}
                    placeholder="e.g. Apex Retail Store"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Operating State</label>
                  <select
                    className="input-field text-xs"
                    value={profile.state}
                    onChange={(e) => setProfile({...profile, state: e.target.value})}
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone / WhatsApp</label>
                  <input 
                    className="input-field text-xs" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Email</label>
                  <input 
                    className="input-field text-xs" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Street Address</label>
                  <input 
                    className="input-field text-xs"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pincode</label>
                  <input 
                    className="input-field text-xs"
                    value={profile.pincode}
                    onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Printer className="w-5 h-5 text-primary-600" /> Invoice Print Layouts
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Template Format</label>
                  <select
                    value={profile.defaultPrintTemplate}
                    onChange={(e) => setProfile({...profile, defaultPrintTemplate: e.target.value})}
                    className="input-field text-xs font-bold"
                  >
                    <option value="thermal">Thermal Slip (80mm / 58mm POS)</option>
                    <option value="a4">Standard A4 / A5 Clean Modern</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Standard Terms & Conditions (PDF Footer)</label>
                <textarea 
                  rows={3}
                  className="input-field text-xs"
                  value={profile.terms}
                  onChange={(e) => setProfile({...profile, terms: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-sm">Business Logo</h3>
              <div className="mx-auto w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                {profile.logoURL ? (
                  <img src={profile.logoURL} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Logo Image URL
                </label>
                <input 
                  type="text"
                  className="input-field text-xs"
                  placeholder="https://example.com/logo.png"
                  value={profile.logoURL}
                  onChange={(e) => setProfile({...profile, logoURL: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAX & BANKING */}
      {activeTab === 'tax_bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          
          {/* GST Profile */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-primary-600" /> GST Tax Profile
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Company GSTIN Number</label>
                <input 
                  className="input-field text-xs font-mono font-bold" 
                  placeholder="27AAACG0000A1Z5"
                  value={profile.gstin}
                  onChange={(e) => setProfile({...profile, gstin: e.target.value.toUpperCase()})}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">GST Tax Scheme</label>
                <select
                  value={profile.gstScheme}
                  onChange={(e) => setProfile({...profile, gstScheme: e.target.value})}
                  className="input-field text-xs font-bold"
                >
                  <option value="Regular">Regular Taxpayer (CGST, SGST, IGST ITC claimable)</option>
                  <option value="Composition">Composition Scheme (1% Flat GST)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.reverseChargeDefault}
                    onChange={(e) => setProfile({...profile, reverseChargeDefault: e.target.checked})}
                    className="rounded text-primary-600"
                  />
                  Enable Reverse Charge Mechanism (RCM) by default
                </label>
              </div>
            </div>
          </div>

          {/* Bank & UPI QR Setup */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <QrCode className="w-5 h-5 text-emerald-600" /> Bank & UPI Details (For Invoice QR)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  UPI ID (VPA) for Instant Payment QR *
                </label>
                <input 
                  className="input-field text-xs font-mono font-bold text-emerald-600" 
                  placeholder="merchant@okhdfcbank or business@upi"
                  value={profile.upiId}
                  onChange={(e) => setProfile({...profile, upiId: e.target.value})}
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Generates clickable & scannable UPI QR on Invoices</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Name</label>
                  <input 
                    className="input-field text-xs" 
                    placeholder="HDFC Bank"
                    value={profile.bankName}
                    onChange={(e) => setProfile({...profile, bankName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">IFSC Code</label>
                  <input 
                    className="input-field text-xs font-mono" 
                    placeholder="HDFC0001234"
                    value={profile.ifscCode}
                    onChange={(e) => setProfile({...profile, ifscCode: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Account Number</label>
                <input 
                  className="input-field text-xs font-mono" 
                  placeholder="50200012345678"
                  value={profile.accountNumber}
                  onChange={(e) => setProfile({...profile, accountNumber: e.target.value})}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Seed Sample Data Card */}
          <div className="card space-y-4 p-6 border-2 border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Fill Sample Data</h3>
                <p className="text-xs text-slate-500">Populate realistic products, invoices, parties & ledgers</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Instantly fill your account with demo products, sales, purchases, bank accounts, expenses, godowns, and orders to test all features.
            </p>

            <button
              onClick={async () => {
                if (!window.confirm('Populate rich sample business dataset in your current company account?')) return;
                try {
                  setBackupLoading(true);
                  await seedMockData(companyId, profile.businessName || 'Apex Retail & Traders');
                  toast.success('Sample data loaded successfully! Refreshing...');
                  setTimeout(() => window.location.reload(), 1200);
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to populate mock data');
                } finally {
                  setBackupLoading(false);
                }
              }}
              disabled={backupLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition-colors"
            >
              {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Populate Sample Business Data
            </button>
          </div>

          {/* Export */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-2xl">
                <Download className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Full Database Backup</h3>
                <p className="text-xs text-slate-500">Export all catalog, invoices, purchases, parties, and accounts to encrypted JSON</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Download your complete company snapshot. You can safely store this offline or restore it anytime.
            </p>

            <button
              onClick={handleExportBackup}
              disabled={backupLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs"
            >
              {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export Full Backup (JSON)
            </button>
          </div>

          {/* Import / Restore */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Restore from Backup</h3>
                <p className="text-xs text-slate-500">Restore your company database from a previous JSON backup</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Restoring will merge existing documents with records from the JSON backup file.</span>
            </div>

            <label className="btn-secondary w-full py-3 flex items-center justify-center gap-2 text-xs cursor-pointer">
              <Upload className="w-4 h-4 text-primary-600" /> Select Backup JSON File
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

        </div>
      )}

      {/* TAB 4: USERS & ACCESS */}
      {activeTab === 'users' && (
        <div className="animate-in slide-in-from-bottom-2 duration-300">
          <UserManagement />
        </div>
      )}
    </div>
  );
};

export default Settings;
