import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  MessageSquare,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';

const StoreFront = () => {
  const { companyId: paramCompanyId } = useParams();
  const [companyId, setCompanyId] = useState(paramCompanyId || '');
  const [companyProfile, setCompanyProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Customer Checkout Form
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    // If no param, try getting from localStorage or first company
    const initStore = async () => {
      try {
        setLoading(true);
        let targetCompId = paramCompanyId;
        if (!targetCompId) {
          const comps = await getDocs(collection(db, 'companies'));
          if (!comps.empty) {
            targetCompId = comps.docs[0].id;
            setCompanyId(targetCompId);
          }
        }

        if (targetCompId) {
          // Company details
          const compSnap = await getDoc(doc(db, 'companies', targetCompId));
          if (compSnap.exists()) setCompanyProfile(compSnap.data());

          // Products
          const prodSnap = await getDocs(query(collection(db, 'products'), where('companyId', '==', targetCompId)));
          const list = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => (p.stock || 0) > 0);
          setProducts(list);
        }
      } catch (err) {
        console.error('Store error:', err);
      } finally {
        setLoading(false);
      }
    };

    initStore();
  }, [paramCompanyId]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nQty = item.qty + delta;
        return nQty > 0 ? { ...item, qty: nQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalCartValue = cart.reduce((sum, i) => sum + (i.sellingPrice * i.qty), 0);
  const totalCartItems = cart.reduce((sum, i) => sum + i.qty, 0);

  // Submit Order directly into database
  const handlePlaceOrder = async (isWhatsApp = false) => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.error('Please enter your name and phone number');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setLoading(true);
      const orderNo = `WEB-${Date.now().toString().slice(-6)}`;
      const orderRecord = {
        orderNo,
        companyId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        deliveryAddress: customerInfo.address,
        notes: customerInfo.notes,
        items: cart.map(i => ({
          productId: i.id,
          name: i.name,
          price: i.sellingPrice,
          qty: i.qty,
          total: i.sellingPrice * i.qty
        })),
        totalAmount: totalCartValue,
        status: 'Pending', // Pending, Accepted, Packed, Shipped, Delivered
        createdAt: new Date()
      };

      await addDoc(collection(db, 'online_orders'), orderRecord);

      // If WhatsApp order, open direct WhatsApp chat
      if (isWhatsApp) {
        let msg = `*🛒 New Order from ${customerInfo.name}*\n`;
        msg += `📞 Phone: ${customerInfo.phone}\n`;
        if (customerInfo.address) msg += `📍 Address: ${customerInfo.address}\n`;
        msg += `\n*Items Ordered:*\n`;
        cart.forEach((item, i) => {
          msg += `${i + 1}. ${item.name} x ${item.qty} = ${formatCurrency(item.sellingPrice * item.qty)}\n`;
        });
        msg += `\n*Total Order Value:* ${formatCurrency(totalCartValue)}\n`;
        if (customerInfo.notes) msg += `Notes: ${customerInfo.notes}\n`;

        const phoneNo = companyProfile?.phone?.replace(/\D/g, '') || '';
        const waUrl = `https://wa.me/${phoneNo}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
      }

      setOrderSuccess(orderNo);
      setCart([]);
      setShowCartDrawer(false);
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Store Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-600/30">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                {companyProfile?.companyName || 'Online Store Catalog'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {companyProfile?.address || 'Fast Delivery & Quality Products'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCartDrawer(true)}
            className="relative p-3 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded-2xl hover:bg-primary-100 transition-all flex items-center gap-2 font-bold text-xs"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">My Cart</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-sm inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Official Online Store
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Browse Products & Order in Seconds</h2>
            <p className="text-primary-100 text-xs sm:text-sm max-w-md">
              Order directly online or via WhatsApp with instant order tracking and fast dispatch.
            </p>
          </div>
          {companyProfile?.phone && (
            <a
              href={`tel:${companyProfile.phone}`}
              className="px-5 py-3 bg-white text-primary-700 font-black text-xs rounded-2xl shadow-md hover:bg-primary-50 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call: {companyProfile.phone}
            </a>
          )}
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold">Loading store catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold">No products available in this category.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => {
              const inCart = cart.find(c => c.id === product.id);
              return (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-200 group"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {product.category || 'General'}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">Brand: {product.brand}</span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-primary-600 dark:text-primary-400">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">per {product.unit || 'pcs'}</span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 p-1 rounded-xl">
                        <button
                          onClick={() => updateQty(product.id, -1)}
                          className="w-6 h-6 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-primary-600">
                          {inCart.qty}
                        </span>
                        <button
                          onClick={() => updateQty(product.id, 1)}
                          className="w-6 h-6 bg-primary-600 text-white rounded-lg flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-primary-600/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Cart Drawer / Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col p-6 space-y-4 animate-slide-left overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" /> Your Shopping Cart
              </h3>
              <button onClick={() => setShowCartDrawer(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart className="w-12 h-12 mb-2 stroke-1 opacity-40" />
                <p className="font-bold text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {/* Items */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                        <span className="text-[11px] text-primary-600 font-bold">{formatCurrency(item.sellingPrice)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white dark:bg-slate-700 rounded text-xs font-bold">-</button>
                        <span className="text-xs font-black w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-primary-600 text-white rounded text-xs font-bold">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Checkout Details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400">Delivery Information</h4>
                  <input
                    type="text"
                    required
                    placeholder="Your Name *"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="input-field text-xs"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile / WhatsApp Number *"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="input-field text-xs"
                  />
                  <textarea
                    placeholder="Delivery Street Address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className="input-field min-h-[50px] text-xs"
                  />
                </div>

                {/* Total & Checkout Buttons */}
                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Total Amount:</span>
                    <span className="text-xl font-black text-primary-600">{formatCurrency(totalCartValue)}</span>
                  </div>

                  <button
                    onClick={() => handlePlaceOrder(true)}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Order via WhatsApp
                  </button>

                  <button
                    onClick={() => handlePlaceOrder(false)}
                    disabled={loading}
                    className="w-full py-3 btn-primary text-xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Direct Web Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreFront;
