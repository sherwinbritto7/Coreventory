import React, { useState, useEffect } from 'react';
import { db, createSecondaryAuth } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  getDocs, 
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  Building2, 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  Mail, 
  Key, 
  Loader2, 
  ArrowRight,
  Package,
  Users,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ExternalLink,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { cn, formatCurrency } from '../../lib/utils';

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const qComp = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubComp = onSnapshot(qComp, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach(doc => {
        const cid = doc.data().companyId;
        if (cid) counts[cid] = (counts[cid] || 0) + 1;
      });
      setUserCounts(counts);
      setLoading(false);
    });

    return () => {
      unsubComp();
      unsubUsers();
    };
  }, []);

  const handleManageCompany = (company) => {
    setSelectedCompany(company);
    setShowManageModal(true);
  };

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-600" />
            Superadmin Panel
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage global companies and their administrative access.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Building2 className="w-5 h-5" />
          <span>Register New Company</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="card p-6 border-none shadow-sm bg-primary-600 text-white flex justify-between items-center">
            <div>
              <p className="text-primary-100 text-sm font-bold uppercase tracking-widest">Total Companies</p>
              <h2 className="text-4xl font-black mt-2">{companies.length}</h2>
            </div>
            <div className="p-4 bg-primary-500/30 rounded-2xl">
              <Building2 className="w-8 h-8" />
            </div>
         </div>
      </div>

      {/* Companies List */}
      <div className="card border-none shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search companies by name..."
              className="input-field pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-center w-16">#</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCompanies.map((company, index) => (
                <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Building2 className="w-5 h-5" />
                       </div>
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-900 dark:text-white">{company.name}</span>
                         <span className="text-[10px] text-slate-400 font-mono">{company.id}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-slate-400" />
                       <span className="font-bold text-slate-700 dark:text-slate-300">
                         {userCounts[company.id] || 0}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-widest">
                        <XCircle className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleManageCompany(company)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl transition-all"
                    >
                      Manage <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>No companies found Matching "{searchTerm}"</p>
                    </div>
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
        title="Register Company & Master Admin"
      >
        <AddCompanyForm onSuccess={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title="Manage Company"
        maxWidth="max-w-4xl"
      >
        {selectedCompany && (
          <ManageCompanyTabs 
            company={selectedCompany} 
            onUpdate={(updated) => {
              setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
              setSelectedCompany(updated);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

const ManageCompanyTabs = ({ company, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
        <button
          onClick={() => setActiveTab('details')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
            activeTab === 'details' ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600" : "text-slate-500"
          )}
        >
          <SettingsIcon className="w-4 h-4" /> Details & Admin
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
            activeTab === 'members' ? "bg-white dark:bg-slate-800 shadow-sm text-primary-600" : "text-slate-500"
          )}
        >
          <Users className="w-4 h-4" /> Staff Members
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'details' ? (
          <CompanyDetailsForm company={company} onUpdate={onUpdate} />
        ) : (
          <CompanyMembersList companyId={company.id} />
        )}
      </div>
    </div>
  );
};

const CompanyDetailsForm = ({ company, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingAdmin, setFetchingAdmin] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [formData, setFormData] = useState({
    name: company.name || '',
    status: company.status || 'active',
    adminName: '',
    adminEmail: ''
  });

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        // Fetch the first admin found for this company
        const q = query(
          collection(db, 'users'), 
          where('companyId', '==', company.id),
          where('role', '==', 'admin'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const adminData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setAdminUser(adminData);
          setFormData(prev => ({
            ...prev,
            adminName: adminData.name || '',
            adminEmail: adminData.email || ''
          }));
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      } finally {
        setFetchingAdmin(false);
      }
    };
    fetchAdmin();
  }, [company.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Update Company Doc
      const companyRef = doc(db, 'companies', company.id);
      batch.update(companyRef, {
        name: formData.name,
        status: formData.status
      });

      // 2. Update Admin User Doc (If exists)
      if (adminUser) {
        const userRef = doc(db, 'users', adminUser.id);
        batch.update(userRef, {
          name: formData.adminName,
          // We don't update email here as it requires Firebase Auth re-auth or Admin SDK
          // But we can update the Firestore record for display parity
          email: formData.adminEmail 
        });
      }

      await batch.commit();
      
      toast.success('Company and Admin updated successfully');
      onUpdate({ ...company, name: formData.name, status: formData.status });
    } catch (error) {
      toast.error('Failed to update details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAdmin) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Section */}
        <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Building2 className="w-3 h-3" /> Company Info
          </h3>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Company Name</label>
            <input
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Account Status</label>
            <select
              className="input-field"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Master Admin Section */}
        <div className="space-y-4 p-4 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl border border-primary-100/50 dark:border-primary-900/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Master Admin Details
          </h3>
          {adminUser ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Admin Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    className="input-field pl-10"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="email"
                    className="input-field pl-10"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Note: Changing email in Firestore for record-keeping. Actual login email update requires user action.
                </p>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-slate-400 text-sm">
              No admin account found for this company.
            </div>
          )}
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Global Changes'}
      </button>
    </form>
  );
};

const CompanyMembersList = ({ companyId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'users'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [companyId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching members...</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {members.map(member => (
        <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
              member.role === 'admin' ? "bg-primary-100 text-primary-600" : "bg-slate-200 text-slate-600"
            )}>
              {member.name?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-white">{member.name}</span>
              <span className="text-xs text-slate-500">{member.email}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
              member.role === 'admin' ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500"
            )}>
              {member.role}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{member.id}</span>
          </div>
        </div>
      ))}
      {members.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          No members found for this company.
        </div>
      )}
    </div>
  );
};

const AddCompanyForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email already exists
      const emailQuery = query(collection(db, 'users'), where('email', '==', formData.adminEmail));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        toast.error('Email already exists! Please use a different email.');
        setLoading(false);
        return;
      }

      const secondaryAuth = createSecondaryAuth();
      const res = await createUserWithEmailAndPassword(secondaryAuth, formData.adminEmail, formData.adminPassword);
      
      const companyId = doc(collection(db, 'companies')).id;

      await setDoc(doc(db, 'companies', companyId), {
        name: formData.companyName,
        createdAt: new Date(),
        status: 'active'
      });

      await setDoc(doc(db, 'users', res.user.uid), {
        name: formData.adminName,
        email: formData.adminEmail,
        role: 'admin',
        companyId: companyId,
        createdAt: new Date()
      });

      await setDoc(doc(db, 'settings', companyId), {
        businessName: formData.companyName,
        email: formData.adminEmail,
        createdAt: new Date()
      });

      await signOut(secondaryAuth);
      
      toast.success('Company and Admin created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
           <Building2 className="w-3 h-3" /> Company Information
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company / Business Name *</label>
          <input 
            required 
            className="input-field"
            placeholder="Global Tech Solutions"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
          />
        </div>
      </div>

      <div className="p-4 bg-primary-50/50 dark:bg-primary-900/5 rounded-2xl border border-primary-100/50 dark:border-primary-900/10">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary-600 mb-4 flex items-center gap-2">
           <Shield className="w-3 h-3" /> Master Admin Details
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Full Name *</label>
            <div className="relative">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required 
                className="input-field pl-12"
                placeholder="John Admin"
                value={formData.adminName}
                onChange={(e) => setFormData({...formData, adminName: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email"
                  required 
                  className="input-field pl-12"
                  placeholder="admin@company.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password"
                  required 
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <button 
          type="button" 
          disabled={loading}
          onClick={() => onSuccess()} 
          className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-[2] btn-primary flex items-center justify-center gap-2 py-4"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Company & Admin'}
        </button>
      </div>
    </form>
  );
};

export default SuperAdminDashboard;
