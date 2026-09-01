import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous doc listener
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.warn("No user document found for uid:", currentUser.uid);
            setUserData({ role: 'staff', name: 'User' });
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore subscription error:", error);
          setUserData({ role: 'staff', name: 'User' });
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Roles and Tenancy helpers
  const isSuperAdmin = userData?.role === 'superadmin';
  const isAdmin = userData?.role === 'admin' || isSuperAdmin;
  const isStaff = userData?.role === 'staff' || isAdmin;
  const companyId = userData?.companyId;

  const value = {
    user,
    userData,
    loading,
    login,
    logout,
    isAdmin,
    isStaff,
    isSuperAdmin,
    companyId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
