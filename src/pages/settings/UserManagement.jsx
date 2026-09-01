import React, { useState, useEffect } from 'react';
import { db, createSecondaryAuth } from '../../lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  User, 
  Shield, 
  UserCog, 
  Trash2, 
  Mail, 
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const { user: currentUser, companyId } = useAuth();

  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId)
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [companyId]);

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.uid) {
      toast.error("You cannot change your own role!");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: selectedUser.name
      });
      toast.success('User updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteClick = (user) => {
    if (user.id === currentUser.uid) {
      toast.error("You cannot delete yourself!");
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      toast.success('User removed from management');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error('Failed to remove user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Staff & User Management</h2>
          <p className="text-sm text-slate-500">Manage access levels for your team members.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="card overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center font-bold">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {u.name || 'Anonymous User'} {u.id === currentUser.uid && "(You)"}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      disabled={u.id === currentUser.uid}
                      value={u.role || 'staff'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(u)}
                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(u)}
                        disabled={u.id === currentUser.uid}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Staff Profile"
      >
        <AddStaffForm onSuccess={() => setShowAddModal(false)} />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User Profile"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  className="input-field pl-12"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Read-only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  disabled
                  className="input-field pl-12 opacity-50"
                  value={selectedUser.email}
                />
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)} 
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] btn-primary"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove Staff Access"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 text-rose-600 rounded-2xl">
            <Trash2 className="w-6 h-6" />
            <p className="text-sm font-medium">
              Are you sure you want to remove dashboard access for <span className="font-bold">"{userToDelete?.name}"</span>? 
              This will only remove their profile from this dashboard, not their login account.
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
              Remove Access
            </button>
          </div>
        </div>
      </Modal>

      <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 flex gap-4">
        <AlertCircle className="w-6 h-6 text-primary-500 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-primary-900 dark:text-primary-200">Admin Privileges</p>
          <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
            As an Administrator, you can create new staff accounts directly. Each staff member will have their own login credentials. You can also manage existing roles and restrict access to sensitive business data.
          </p>
        </div>
      </div>
    </div>
  );
};

const AddStaffForm = ({ onSuccess }) => {
  const { companyId } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email already exists
      const emailQuery = query(collection(db, 'users'), where('email', '==', formData.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        toast.error('Email already exists! Please use a different email.');
        setLoading(false);
        return;
      }

      const secondaryAuth = createSecondaryAuth();
      const res = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      
      // Create user doc in main Firestore
      await setDoc(doc(db, 'users', res.user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        companyId, // Link staff to the admin's company
        createdAt: new Date()
      });

      // Sign out from secondary auth to avoid session issues
      await signOut(secondaryAuth);
      
      toast.success('Staff account created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            required
            className="input-field pl-12"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="email"
            required
            className="input-field pl-12"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="staff@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Temporary Password</label>
        <div className="relative">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="password"
            required
            className="input-field pl-12"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">System Role</label>
        <select 
          className="input-field"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="staff">Staff (Basic Access)</option>
          <option value="admin">Admin (Full Access)</option>
        </select>
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
          className="flex-[2] btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </div>
    </form>
  );
};

export default UserManagement;
