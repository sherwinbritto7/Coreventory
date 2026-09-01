import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { 
  ShoppingBag, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileText, 
  ArrowRight, 
  Phone, 
  MapPin, 
  MessageSquare,
  PackageCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

const OrdersList = () => {
  const { companyId } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!companyId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'online_orders'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt));
        setOrders(list);
      } catch (err) {
        console.error('Error fetching online orders:', err);
        toast.error('Failed to load online orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [companyId]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'online_orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleConvertToInvoice = (order) => {
    // Navigate to Sales Entry pre-filled with order items
    navigate('/sales/new', {
      state: {
        convertedOrder: order
      }
    });
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || o.orderNo?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.customerPhone?.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-primary-600" /> Web Shop & WhatsApp Orders
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage incoming digital catalog orders, track shipment pipeline, and convert orders to Tax Invoices.
          </p>
        </div>

        <a
          href={`/store/${companyId}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary flex items-center gap-2 text-xs py-2"
        >
          <ShoppingBag className="w-4 h-4" /> Open Public Web Store
        </a>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order no, customer, phone..."
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Pending', 'Accepted', 'Packed', 'Shipped', 'Delivered', 'Invoiced'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <ShoppingBag className="w-12 h-12 stroke-1 mb-2 opacity-40" />
            <p className="font-bold text-sm">No digital orders received yet</p>
            <p className="text-xs text-slate-500 mt-1">Share your public store link with customers to receive web/WhatsApp orders</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Customer & Contact</th>
                  <th className="py-3 px-4">Delivery Address</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Order Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600">
                      {order.orderNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 dark:text-white">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {order.deliveryAddress || 'Self Pickup'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {order.items?.length || 0} Items
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-none outline-none ${
                          order.status === 'Delivered' || order.status === 'Invoiced'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : order.status === 'Shipped' || order.status === 'Packed'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Invoiced">Invoiced</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(order.totalAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {order.status !== 'Invoiced' && (
                        <button
                          onClick={() => handleConvertToInvoice(order)}
                          className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold rounded-lg hover:bg-primary-100 text-[11px] inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Convert to Invoice
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersList;
