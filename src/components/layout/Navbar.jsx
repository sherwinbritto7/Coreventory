import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, Sun, Moon, AlertTriangle, X, ChevronRight, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/inventory': 'Product Master',
  '/inventory/adjustments': 'Stock Adjustments',
  '/inventory/godowns': 'Godowns & Warehouses',
  '/inventory/barcodes': 'Barcode Labels',
  '/sales': 'Sales Invoices',
  '/sales/new': 'New Sales Invoice',
  '/challans': 'Delivery Challans',
  '/returns': 'Returns & Credit Notes',
  '/quotations': 'Quotations & Estimates',
  '/quotations/new': 'New Quotation',
  '/purchases': 'Purchase Bills',
  '/banking': 'Cash & Bank Accounts',
  '/expenses': 'Expense Tracker',
  '/payments': 'Payment Vouchers',
  '/customers': 'Customers Directory',
  '/suppliers': 'Suppliers Directory',
  '/gst-reports': 'GST Returns & E-Way',
  '/reports': 'Business Reports & P&L',
  '/orders': 'Online Orders',
  '/marketing': 'WhatsApp Reminders & Promos',
  '/settings': 'Settings & Backup',
  '/superadmin': 'Super Admin Dashboard',
};

const Navbar = ({ toggleSidebar }) => {
  const { userData, isSuperAdmin, companyId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyProfile, setCompanyProfile] = useState(null);

  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);

  // Active Title
  const activeTitle = ROUTE_TITLES[location.pathname] || 'Coreventory ERP';

  // Update browser tab document.title dynamically
  useEffect(() => {
    document.title = `${activeTitle} | Coreventory ERP`;
  }, [activeTitle]);

  useEffect(() => {
    if (!companyId) return;

    // Company info
    getDoc(doc(db, 'companies', companyId)).then(snap => {
      if (snap.exists()) setCompanyProfile(snap.data());
    }).catch(() => {});

    if (isSuperAdmin) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'products'), 
      where('companyId', '==', companyId)
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const lowStockProducts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.stock <= (p.lowStockThreshold || 0));
        
        setNotifications(lowStockProducts);
      },
      (error) => {
        console.error("Error fetching low stock notifications:", error);
      }
    );

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [companyId, isSuperAdmin]);

  const toggleTheme = () => {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    setIsDark(isDarkNow);
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-white/90 dark:bg-[#121215]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 gap-4">
      {/* Left: Mobile Toggle & Page Title Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 lg:hidden rounded-md shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Title Bar / Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 hidden sm:flex shrink-0">
            <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
              {companyProfile?.companyName || 'Coreventory'}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-600" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
            {activeTitle}
          </h2>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md hidden md:block">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search items, invoices, parties..." 
            className="w-full h-8 pl-8 pr-11 text-xs bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-zinc-100 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-medium text-slate-400 dark:text-zinc-500 px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 select-none">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        
        {/* Notifications */}
        {!isSuperAdmin && (
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative p-1.5 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60 rounded-lg transition-colors",
                showNotifications && "bg-slate-100 dark:bg-zinc-800/60 text-slate-900 dark:text-zinc-100"
              )}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Notifications</h4>
                  <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-[10px] font-semibold rounded-md">
                    {notifications.length} Low Stock
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                  {notifications.length > 0 ? (
                    notifications.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          navigate('/inventory');
                          setShowNotifications(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors flex items-start gap-2.5"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-zinc-100">{product.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Stock: <strong className="text-rose-500">{product.stock} {product.unit}</strong> (Threshold: {product.lowStockThreshold})
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      All stock levels healthy.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5" />

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
            {(userData?.name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
