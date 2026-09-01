import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Users,
  Sparkles
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { formatCurrency, formatIndianNumber, cn } from "../../lib/utils";
import { seedMockData } from "../../utils/mockDataLoader";
import {
  subMonths,
  format,
  startOfDay,
} from "date-fns";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { companyId } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    salesCount: 0,
    cashSales: 0,
    creditSales: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("thisMonth");

  useEffect(() => {
    if (companyId) {
      fetchDashboardData();
    }
  }, [dateRange, companyId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Sales
      const salesQuery = query(
        collection(db, "sales"),
        where("companyId", "==", companyId),
      );
      const salesSnap = await getDocs(salesQuery);
      let allSales = salesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

      // 2. Fetch Purchases
      const purchaseQuery = query(
        collection(db, "purchases"),
        where("companyId", "==", companyId),
      );
      const purchaseSnap = await getDocs(purchaseQuery);
      let allPurchases = purchaseSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

      // Apply Date Filter
      const now = new Date();
      const applyDateFilter = (items) => items.filter(item => {
        if (dateRange === "allTime") return true;
        const itemDate = new Date(item.date?.seconds * 1000 || Date.now());
        if (dateRange === "today") return itemDate.toDateString() === now.toDateString();
        if (dateRange === "thisMonth") return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (dateRange === "lastMonth") {
          const lastM = subMonths(now, 1);
          return itemDate.getMonth() === lastM.getMonth() && itemDate.getFullYear() === lastM.getFullYear();
        }
        return true;
      });

      allSales = applyDateFilter(allSales);
      allPurchases = applyDateFilter(allPurchases);

      // Calculate Metrics
      const totalRevenue = allSales.reduce((acc, sale) => acc + (parseFloat(sale.grandTotal || sale.total || 0)), 0);
      const totalExpenses = allPurchases.reduce((acc, p) => acc + ((parseFloat(p.buyingPrice || 0)) * (p.qty || 1)), 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      const cashSales = allSales.filter(s => s.saleType === 'Cash').reduce((acc, sale) => acc + (parseFloat(sale.grandTotal || 0)), 0);
      const creditSales = allSales.filter(s => s.saleType === 'Due' || s.saleType === 'Credit').reduce((acc, sale) => acc + (parseFloat(sale.grandTotal || 0)), 0);

      // Top Products
      const productMap = {};
      allSales.forEach(sale => {
        (sale.items || []).forEach(item => {
          if (!productMap[item.name]) {
            productMap[item.name] = { name: item.name, units: 0, revenue: 0 };
          }
          productMap[item.name].units += (item.qty || item.quantity || 1);
          productMap[item.name].revenue += (item.total || (item.price * (item.qty || 1)));
        });
      });
      const topProductsList = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(topProductsList);

      // Stock Status by Category
      const productsQuery = query(
        collection(db, "products"),
        where("companyId", "==", companyId),
      );
      const productSnap = await getDocs(productsQuery);
      const allProductsData = productSnap.docs.map(doc => doc.data());
      
      const catStockMap = {};
      allProductsData.forEach(p => {
        const cat = p.category || 'General';
        if (!catStockMap[cat]) catStockMap[cat] = { total: 0, low: 0 };
        catStockMap[cat].total++;
        if (p.stock <= (p.lowStockThreshold || 10)) catStockMap[cat].low++;
      });
      
      const stockStatus = Object.keys(catStockMap).map(cat => ({
        label: cat,
        percentage: Math.round(((catStockMap[cat].total - catStockMap[cat].low) / catStockMap[cat].total) * 100),
        lowCount: catStockMap[cat].low
      })).sort((a, b) => a.percentage - b.percentage);

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        salesCount: allSales.length,
        cashSales,
        creditSales,
        stockStatus,
        lowStockTotal: allProductsData.filter(p => p.stock <= (p.lowStockThreshold || 10)).length
      });

      // Chart Map
      const chartMap = {};
      allSales.forEach((sale) => {
        const saleDate = sale.date?.seconds ? new Date(sale.date.seconds * 1000) : new Date(sale.date || Date.now());
        const day = format(saleDate, "MMM dd");
        const timestamp = startOfDay(saleDate).getTime();
        if (!chartMap[timestamp]) chartMap[timestamp] = { name: day, revenue: 0, expenses: 0, timestamp };
        chartMap[timestamp].revenue += (parseFloat(sale.grandTotal || sale.total || 0));
      });
      allPurchases.forEach((p) => {
        const pDate = p.date?.seconds ? new Date(p.date.seconds * 1000) : new Date(p.date || Date.now());
        const day = format(pDate, "MMM dd");
        const timestamp = startOfDay(pDate).getTime();
        if (!chartMap[timestamp]) chartMap[timestamp] = { name: day, revenue: 0, expenses: 0, timestamp };
        chartMap[timestamp].expenses += ((parseFloat(p.buyingPrice || 0)) * (p.qty || 1));
      });

      const sortedData = Object.values(chartMap)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ name, revenue, expenses }) => ({ name, revenue, expenses }));

      setSalesData(sortedData.length > 0 ? sortedData : [
        { name: "Mon", revenue: 12000, expenses: 8000 },
        { name: "Tue", revenue: 19000, expenses: 11000 },
        { name: "Wed", revenue: 15000, expenses: 9500 },
        { name: "Thu", revenue: 22000, expenses: 14000 },
        { name: "Fri", revenue: 28000, expenses: 16000 },
        { name: "Sat", revenue: 32000, expenses: 19000 },
      ]);

      // Category Breakdown
      const catMap = {};
      allSales.forEach((sale) => {
        (sale.items || []).forEach((item) => {
          const cat = item.category || item.name || "General";
          catMap[cat] = (catMap[cat] || 0) + (item.total || 0);
        });
      });
      setCategoryData(
        Object.keys(catMap).map((cat) => ({ name: cat, value: catMap[cat] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0f172a", "#475569", "#64748b", "#94a3b8", "#cbd5e1"];

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Key operational metrics and revenue summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-lg text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none text-xs font-medium focus:ring-0 outline-none text-slate-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="allTime">All Time</option>
            </select>
          </div>

          <button 
            onClick={async () => {
              if (!window.confirm('Populate rich sample business dataset in your current account?')) return;
              try {
                toast.loading('Filling mock data...', { id: 'mock-load' });
                await seedMockData(companyId, 'Apex Retail & Traders');
                toast.success('Sample business data filled!', { id: 'mock-load' });
                setTimeout(() => window.location.reload(), 1000);
              } catch (err) {
                console.error(err);
                toast.error('Failed to fill mock data', { id: 'mock-load' });
              }
            }}
            className="btn-primary flex items-center gap-1.5"
            title="Populate complete sample business dataset"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fill Mock Data</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="btn-secondary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Total Revenue</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded">
              +{stats.salesCount} Bills
            </span>
          </div>
          <p className="text-xl font-semibold text-slate-950 dark:text-white mt-2 tabular-nums">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Invoiced sales</span>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Purchases & Cost</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded">
              COGS
            </span>
          </div>
          <p className="text-xl font-semibold text-slate-950 dark:text-white mt-2 tabular-nums">
            {formatCurrency(stats.totalExpenses)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Direct goods cost</span>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Net Profit</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded">
              {stats.profitMargin.toFixed(1)}% Margin
            </span>
          </div>
          <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(stats.netProfit)}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Gross profit margin</span>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Stock Alerts</span>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded",
              stats.lowStockTotal > 0 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
            )}>
              {stats.lowStockTotal} Items
            </span>
          </div>
          <p className="text-xl font-semibold text-slate-950 dark:text-white mt-2 tabular-nums">
            {stats.lowStockTotal} Items
          </p>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">Below safety threshold</span>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart (2 Cols) */}
        <div className="card lg:col-span-2 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Revenue & Expense Trend</h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-600" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 10 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 10 }} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    fontSize: "11px",
                    padding: "6px 10px"
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={1.5} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#94a3b8" strokeWidth={1.5} fill="transparent" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products (1 Col) */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Top Selling Products</h3>
            <span className="text-[10px] text-slate-400">By Revenue</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 flex-1">
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-slate-900 dark:text-zinc-100 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.units} units sold</p>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No product sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Health Table */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">Category Stock Health</h3>
          <span className="text-[10px] text-slate-400">Availability ratio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(stats.stockStatus || []).slice(0, 3).map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200/60 dark:border-zinc-800/60 space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-800 dark:text-zinc-200">{item.label}</span>
                <span className={item.percentage < 50 ? "text-rose-500 font-bold" : "text-slate-500"}>{item.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    item.percentage > 70 ? "bg-slate-900 dark:bg-zinc-100" : item.percentage > 30 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
