import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut,
  ChevronLeft,
  FileText,
  Truck,
  Shield,
  Barcode,
  RotateCcw,
  Building2,
  Receipt,
  DollarSign,
  FileCheck2,
  BarChart3,
  ShoppingBag,
  MessageSquare,
  Warehouse,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import lightlogo from '../../assets/lightlogo.png';
import darklogo from '../../assets/darklogo.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, isAdmin, isSuperAdmin, userData } = useAuth();

  const navSections = [
    {
      title: 'Overview',
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin'] },
        { title: 'POS Billing', icon: Barcode, path: '/pos', roles: ['admin', 'staff', 'cashier'], badge: 'POS' },
      ]
    },
    {
      title: 'Sales & Billing',
      items: [
        { title: 'Invoices', icon: ShoppingCart, path: '/sales', roles: ['admin', 'staff', 'cashier'] },
        { title: 'Quotations', icon: FileText, path: '/quotations', roles: ['admin', 'staff'] },
        { title: 'Delivery Challans', icon: Truck, path: '/challans', roles: ['admin', 'staff', 'warehouse_manager'] },
        { title: 'Credit & Debit Notes', icon: RotateCcw, path: '/returns', roles: ['admin', 'staff'] },
      ]
    },
    {
      title: 'Inventory & Warehouses',
      items: [
        { title: 'Products', icon: Package, path: '/inventory', roles: ['admin', 'staff', 'warehouse_manager'] },
        { title: 'Stock Adjustments', icon: ArrowRightLeft, path: '/inventory/adjustments', roles: ['admin', 'staff', 'warehouse_manager'] },
        { title: 'Godowns', icon: Warehouse, path: '/inventory/godowns', roles: ['admin', 'staff', 'warehouse_manager'] },
        { title: 'Barcode Generator', icon: Barcode, path: '/inventory/barcodes', roles: ['admin', 'staff'] },
      ]
    },
    {
      title: 'Finance & Ledgers',
      items: [
        { title: 'Purchases', icon: TrendingUp, path: '/purchases', roles: ['admin', 'staff', 'accountant'] },
        { title: 'Expenses', icon: Receipt, path: '/expenses', roles: ['admin', 'staff', 'accountant'] },
        { title: 'Payment In & Out', icon: DollarSign, path: '/payments', roles: ['admin', 'staff', 'accountant'] },
        { title: 'Cash & Bank Accounts', icon: Building2, path: '/banking', roles: ['admin', 'accountant'] },
      ]
    },
    {
      title: 'Contacts',
      items: [
        { title: 'Customers', icon: Users, path: '/customers', roles: ['admin', 'staff', 'cashier'] },
        { title: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['admin', 'staff'] },
      ]
    },
    {
      title: 'Compliance & Analytics',
      items: [
        { title: 'GST Returns & E-Way', icon: FileCheck2, path: '/gst-reports', roles: ['admin', 'accountant'] },
        { title: 'Reports & Analytics', icon: BarChart3, path: '/reports', roles: ['admin', 'accountant'] },
      ]
    },
    {
      title: 'Digital Channels',
      items: [
        { title: 'Online Orders', icon: ShoppingBag, path: '/orders', roles: ['admin', 'staff'] },
        { title: 'WhatsApp Reminders', icon: MessageSquare, path: '/marketing', roles: ['admin', 'staff'] },
      ]
    },
    {
      title: 'System',
      items: [
        { title: 'Settings', icon: Settings, path: '/settings', roles: ['admin'] },
        { title: 'Super Admin', icon: Shield, path: '/superadmin', roles: ['superadmin'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-[#121215] border-r border-slate-200/80 dark:border-zinc-800/80 transition-transform duration-200 ease-in-out transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo / Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200/80 dark:border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <img src={lightlogo} alt="Coreventory" className="h-6 dark:hidden block object-contain" />
              <img src={darklogo} alt="Coreventory" className="h-6 hidden dark:block object-contain" />
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 lg:hidden rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4 no-scrollbar">
            {navSections.map((section, sIdx) => {
              const visibleItems = section.items.filter(item => !item.roles || item.roles.includes(userData?.role));
              if (visibleItems.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-0.5">
                  <span className="px-2.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                    {section.title}
                  </span>
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 group",
                        isActive 
                          ? "bg-slate-100 dark:bg-zinc-800/90 text-slate-950 dark:text-white font-semibold"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200 font-normal"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded font-mono">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* User Profile & Logout Block */}
          <div className="p-2.5 border-t border-slate-200/80 dark:border-zinc-800/80 shrink-0 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(userData?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate leading-tight">
                    {userData?.name || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 capitalize leading-tight">
                    {userData?.role || 'Staff'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
