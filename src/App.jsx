import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Core Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ProductList from './pages/inventory/ProductList';
import StockAdjustments from './pages/inventory/StockAdjustments';
import GodownManagement from './pages/inventory/GodownManagement';
import BarcodeGenerator from './pages/inventory/BarcodeGenerator';

// Sales & POS Pages
import SalesList from './pages/sales/SalesList';
import SalesEntry from './pages/sales/SalesEntry';
import POSBilling from './pages/pos/POSBilling';
import DeliveryChallans from './pages/sales/DeliveryChallans';
import ReturnsAndNotes from './pages/sales/ReturnsAndNotes';
import QuotationList from './pages/quotations/QuotationList';
import QuotationEntry from './pages/quotations/QuotationEntry';

// Purchases & Accounting Pages
import PurchaseList from './pages/purchases/PurchaseList';
import Banking from './pages/accounting/Banking';
import Expenses from './pages/accounting/Expenses';
import PaymentVouchers from './pages/accounting/PaymentVouchers';

// Parties & CRM
import PeopleList from './pages/people/PeopleList';

// GST & Intelligence Reports
import GSTReports from './pages/gst/GSTReports';
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Digital Storefront & Marketing
import StoreFront from './pages/store/StoreFront';
import OrdersList from './pages/orders/OrdersList';
import RemindersAndPromotions from './pages/marketing/RemindersAndPromotions';

// Settings & SuperAdmin
import Settings from './pages/settings/Settings';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, roles, noLayout = false }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && userData && !roles.includes(userData.role)) {
    if (userData.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    return <Navigate to="/inventory" replace />;
  }

  if (noLayout) {
    return children;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '16px',
              background: '#fff',
              color: '#1e293b',
              padding: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
          }} 
        />
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/store/:companyId" element={<StoreFront />} />
          <Route path="/store" element={<StoreFront />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Dashboard */}
          <Route path="/" element={
            <ProtectedRoute roles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* POS Fast Billing (Standalone Full-Screen Terminal) */}
          <Route path="/pos" element={
            <ProtectedRoute roles={['admin', 'staff', 'cashier']} noLayout>
              <POSBilling />
            </ProtectedRoute>
          } />

          {/* Inventory & Warehouses */}
          <Route path="/inventory" element={
            <ProtectedRoute roles={['admin', 'staff', 'warehouse_manager']}>
              <ProductList />
            </ProtectedRoute>
          } />
          <Route path="/inventory/adjustments" element={
            <ProtectedRoute roles={['admin', 'staff', 'warehouse_manager']}>
              <StockAdjustments />
            </ProtectedRoute>
          } />
          <Route path="/inventory/godowns" element={
            <ProtectedRoute roles={['admin', 'staff', 'warehouse_manager']}>
              <GodownManagement />
            </ProtectedRoute>
          } />
          <Route path="/inventory/barcodes" element={
            <ProtectedRoute roles={['admin', 'staff', 'warehouse_manager']}>
              <BarcodeGenerator />
            </ProtectedRoute>
          } />

          {/* Sales & Billing */}
          <Route path="/sales" element={
            <ProtectedRoute roles={['admin', 'staff', 'cashier']}>
              <SalesList />
            </ProtectedRoute>
          } />
          <Route path="/sales/new" element={
            <ProtectedRoute roles={['admin', 'staff', 'cashier']}>
              <SalesEntry />
            </ProtectedRoute>
          } />
          <Route path="/challans" element={
            <ProtectedRoute roles={['admin', 'staff', 'warehouse_manager']}>
              <DeliveryChallans />
            </ProtectedRoute>
          } />
          <Route path="/returns" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <ReturnsAndNotes />
            </ProtectedRoute>
          } />
          <Route path="/quotations" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <QuotationList />
            </ProtectedRoute>
          } />
          <Route path="/quotations/new" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <QuotationEntry />
            </ProtectedRoute>
          } />

          {/* Purchases & Accounting */}
          <Route path="/purchases" element={
            <ProtectedRoute roles={['admin', 'staff', 'accountant']}>
              <PurchaseList />
            </ProtectedRoute>
          } />
          <Route path="/banking" element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <Banking />
            </ProtectedRoute>
          } />
          <Route path="/expenses" element={
            <ProtectedRoute roles={['admin', 'staff', 'accountant']}>
              <Expenses />
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute roles={['admin', 'staff', 'accountant']}>
              <PaymentVouchers />
            </ProtectedRoute>
          } />

          {/* Parties & CRM */}
          <Route path="/customers" element={
            <ProtectedRoute roles={['admin', 'staff', 'cashier']}>
              <PeopleList type="customers" />
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <PeopleList type="suppliers" />
            </ProtectedRoute>
          } />

          {/* GST Compliance & Intelligence Reports */}
          <Route path="/gst-reports" element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <GSTReports />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={['admin', 'accountant']}>
              <ReportsDashboard />
            </ProtectedRoute>
          } />

          {/* Digital Orders & Growth Marketing */}
          <Route path="/orders" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <OrdersList />
            </ProtectedRoute>
          } />
          <Route path="/marketing" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <RemindersAndPromotions />
            </ProtectedRoute>
          } />

          {/* System Control */}
          <Route path="/settings" element={
            <ProtectedRoute roles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/superadmin" element={
            <ProtectedRoute roles={['superadmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
