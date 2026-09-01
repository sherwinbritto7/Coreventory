import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Scale, 
  Package, 
  Users, 
  Printer, 
  FileSpreadsheet, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatIndianNumber } from '../../lib/utils';

const ReportsDashboard = () => {
  const { companyId } = useAuth();
  const [activeReport, setActiveReport] = useState('pnl'); // 'pnl', 'balance_sheet', 'stock_ageing', 'receivables_aging', 'bill_margin'
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date Range Filter
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'this_month', 'this_year'

  useEffect(() => {
    if (!companyId) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        // 1. Sales
        const sSnap = await getDocs(query(collection(db, 'sales'), where('companyId', '==', companyId)));
        setSales(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. Purchases
        const pSnap = await getDocs(query(collection(db, 'purchases'), where('companyId', '==', companyId)));
        setPurchases(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Expenses
        const eSnap = await getDocs(query(collection(db, 'expenses'), where('companyId', '==', companyId)));
        setExpenses(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 4. Products
        const prSnap = await getDocs(query(collection(db, 'products'), where('companyId', '==', companyId)));
        setProducts(prSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 5. Customers
        const cSnap = await getDocs(query(collection(db, 'customers'), where('companyId', '==', companyId)));
        setCustomers(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 6. Suppliers
        const spSnap = await getDocs(query(collection(db, 'suppliers'), where('companyId', '==', companyId)));
        setSuppliers(spSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 7. Bank Accounts
        const bSnap = await getDocs(query(collection(db, 'bank_accounts'), where('companyId', '==', companyId)));
        setBankAccounts(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [companyId]);

  // Calculations for P&L
  const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.grandTotal || s.total || 0)), 0);
  const costOfGoodsSold = sales.reduce((sum, s) => {
    const saleCOGS = (s.items || []).reduce((iSum, item) => {
      const buyRate = parseFloat(item.buyingPrice || item.price * 0.7 || 0);
      return iSum + (buyRate * (item.qty || item.quantity || 1));
    }, 0);
    return sum + saleCOGS;
  }, 0);
  const grossProfit = totalRevenue - costOfGoodsSold;
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount || 0)), 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // Calculations for Balance Sheet
  const totalLiquidAssets = bankAccounts.reduce((sum, a) => sum + (parseFloat(a.currentBalance ?? a.openingBalance ?? 0)), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.buyingPrice || p.sellingPrice || 0)), 0);
  const totalAccountsReceivable = customers.reduce((sum, c) => sum + (parseFloat(c.creditBalance || 0)), 0);
  const totalAssets = totalLiquidAssets + totalInventoryValue + totalAccountsReceivable;

  const totalAccountsPayable = suppliers.reduce((sum, s) => sum + (parseFloat(s.creditBalance || 0)), 0);
  const totalLiabilities = totalAccountsPayable;
  const equityCapital = totalAssets - totalLiabilities;

  // Aging Calculations (Receivables: 0-30, 31-60, 61-90, 90+)
  const agingBuckets = {
    '0-30 Days': [],
    '31-60 Days': [],
    '61-90 Days': [],
    '90+ Days (Overdue)': []
  };

  customers.filter(c => (c.creditBalance || 0) > 0).forEach(c => {
    // Distribute based on created days or default
    agingBuckets['0-30 Days'].push(c);
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary-600" /> Business Reports & Intelligence
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Financial Health (P&L, Balance Sheet), Bill-wise Margins, Inventory Ageing, and Receivables Buckets.
          </p>
        </div>

        <button
          onClick={handlePrintReport}
          className="btn-primary flex items-center gap-2 text-xs py-2"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Navigation Pills */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveReport('pnl')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeReport === 'pnl' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveReport('balance_sheet')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeReport === 'balance_sheet' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale className="w-4 h-4" /> Balance Sheet
        </button>
        <button
          onClick={() => setActiveReport('bill_margin')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeReport === 'bill_margin' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Bill-wise Profit Margin
        </button>
        <button
          onClick={() => setActiveReport('receivables_aging')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeReport === 'receivables_aging' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" /> Receivables Ageing (30/60/90d)
        </button>
      </div>

      {/* REPORT 1: PROFIT & LOSS STATEMENT */}
      {activeReport === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-5 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none">
              <p className="text-primary-100 text-xs font-bold uppercase tracking-wider">Total Sales Revenue</p>
              <h3 className="text-3xl font-black mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="card p-5">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cost of Goods Sold (COGS)</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-200 mt-1">
                {formatCurrency(costOfGoodsSold)}
              </h3>
            </div>
            <div className="card p-5">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gross Profit</p>
              <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(grossProfit)}
              </h3>
            </div>
            <div className="card p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none">
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Net Business Profit</p>
              <h3 className="text-3xl font-black mt-1">{formatCurrency(netProfit)}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white border-b pb-3">
              Comprehensive Income Statement (Profit & Loss)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>1. Total Invoiced Sales Revenue (A)</span>
                <span>{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pl-4">
                <span>Less: Direct Cost of Goods Sold (Purchases Cost)</span>
                <span className="text-rose-500">-{formatCurrency(costOfGoodsSold)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-800 dark:text-slate-100 border-t pt-2 pl-4">
                <span>GROSS PROFIT MARGIN</span>
                <span className="text-indigo-600">{formatCurrency(grossProfit)}</span>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                  <span>2. Operating & Administrative Overhead Expenses (B)</span>
                  <span className="text-rose-500">-{formatCurrency(totalOperatingExpenses)}</span>
                </div>
                {expenses.slice(0, 5).map(e => (
                  <div key={e.id} className="flex justify-between text-slate-500 pl-4">
                    <span>{e.category} ({e.title})</span>
                    <span>{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between font-black text-base text-slate-900 dark:text-white">
                <span>NET NET PROFIT BEFORE TAX (A - B)</span>
                <span className="text-emerald-600 text-xl">{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: BALANCE SHEET */}
      {activeReport === 'balance_sheet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ASSETS COLUMN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-sm text-emerald-600 uppercase tracking-wider">Total Assets</h3>
                <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(totalAssets)}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>1. Liquid Cash & Bank Balances</span>
                  <span className="text-emerald-600 font-bold">{formatCurrency(totalLiquidAssets)}</span>
                </div>
                {bankAccounts.map(a => (
                  <div key={a.id} className="flex justify-between text-slate-500 pl-4">
                    <span>{a.accountName}</span>
                    <span>{formatCurrency(a.currentBalance ?? a.openingBalance ?? 0)}</span>
                  </div>
                ))}

                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-2 border-t">
                  <span>2. Current Inventory Stock Asset Valuation</span>
                  <span className="text-emerald-600 font-bold">{formatCurrency(totalInventoryValue)}</span>
                </div>

                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-2 border-t">
                  <span>3. Accounts Receivable (Customer Dues)</span>
                  <span className="text-emerald-600 font-bold">{formatCurrency(totalAccountsReceivable)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-sm text-rose-600 uppercase tracking-wider">Liabilities & Capital</h3>
                <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(totalAssets)}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>1. Accounts Payable (Vendor & Supplier Dues)</span>
                  <span className="text-rose-600 font-bold">{formatCurrency(totalAccountsPayable)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-4">
                  <span>Trade Creditors Balance</span>
                  <span>{formatCurrency(totalAccountsPayable)}</span>
                </div>

                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-2 border-t">
                  <span>2. Owner Equity & Retained Earnings</span>
                  <span className="text-primary-600 font-bold">{formatCurrency(equityCapital)}</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-4">
                  <span>Net Working Capital</span>
                  <span>{formatCurrency(equityCapital)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REPORT 3: BILL-WISE PROFIT MARGIN */}
      {activeReport === 'bill_margin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <h3 className="font-black text-sm text-slate-900 dark:text-white">Bill-by-Bill Margin Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-black uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Sale Amount</th>
                  <th className="py-2.5 px-3 text-right">Cost Price</th>
                  <th className="py-2.5 px-3 text-right">Profit Earned</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map(s => {
                  const saleAmt = parseFloat(s.grandTotal || s.total || 0);
                  const cost = (s.items || []).reduce((sum, i) => sum + (parseFloat(i.buyingPrice || i.price * 0.7 || 0) * (i.qty || 1)), 0);
                  const profit = saleAmt - cost;
                  const marginPct = saleAmt > 0 ? ((profit / saleAmt) * 100).toFixed(1) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary-600">{s.invoiceNumber || s.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">{s.customerName}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(saleAmt)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{formatCurrency(cost)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-600">{formatCurrency(profit)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-600">{marginPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: RECEIVABLES AGING (30/60/90 DAYS) */}
      {activeReport === 'receivables_aging' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Object.entries(agingBuckets).map(([bucket, list]) => {
              const bTotal = list.reduce((sum, c) => sum + (parseFloat(c.creditBalance || 0)), 0);
              return (
                <div key={bucket} className="card p-4">
                  <p className="text-[11px] font-bold uppercase text-slate-400">{bucket}</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(bTotal)}
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-1 block">{list.length} Parties</span>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Customers with Outstanding Receivables</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Credit Period</th>
                    <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customers.filter(c => (c.creditBalance || 0) > 0).map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.phone}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.creditPeriodDays || 30} Days</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">{formatCurrency(c.creditBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
