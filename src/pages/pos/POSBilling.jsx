import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  Tag,
  X,
  Settings,
  Maximize2,
  Minimize2,
  LogOut,
  Volume2,
  VolumeX,
  FileText,
  Store,
  User,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { generateUPIString } from '../../utils/taxEngine';
import { Link, useNavigate } from 'react-router-dom';

const POSBilling = () => {
  const { companyId, userData } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [heldCarts, setHeldCarts] = useState([]);
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Customer info for bill
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Split Tender states
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash', 'UPI', 'Card', 'Split'

  // POS Configuration Settings (Persisted in localStorage)
  const [posConfig, setPosConfig] = useState(() => {
    const saved = localStorage.getItem(`pos_config_${companyId}`);
    return saved ? JSON.parse(saved) : {
      receiptFormat: 'thermal80', // 'thermal80', 'thermal58', 'a4'
      autoPrint: true,
      soundEnabled: true,
      quickCashButtons: true,
      showStockAlerts: true,
    };
  });

  const searchInputRef = useRef(null);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Beep sound function for barcode scan using Web Audio API
  const playScanBeep = () => {
    if (!posConfig.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  // Load products and company info
  useEffect(() => {
    if (!companyId) return;

    const fetchPOSData = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(list);

        const compSnap = await getDoc(doc(db, 'companies', companyId));
        if (compSnap.exists()) {
          setCompanyProfile(compSnap.data());
        }

        const savedHeld = localStorage.getItem(`held_carts_${companyId}`);
        if (savedHeld) {
          try { setHeldCarts(JSON.parse(savedHeld)); } catch (e) {}
        }
      } catch (err) {
        console.error('Error fetching POS data:', err);
        toast.error('Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    fetchPOSData();
  }, [companyId]);

  // Save POS config updates
  const updatePosConfig = (newSettings) => {
    const updated = { ...posConfig, ...newSettings };
    setPosConfig(updated);
    localStorage.setItem(`pos_config_${companyId}`, JSON.stringify(updated));
    toast.success('POS Settings Saved');
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Theme toggle
  const toggleTheme = () => {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    setIsDark(isDarkNow);
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        handleOpenTender();
      }
      if (e.key === 'F7' && cart.length > 0) {
        e.preventDefault();
        handleHoldCart();
      }
      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault();
        quickCashCheckout();
      }
      if (e.key === 'Escape') {
        setShowTenderModal(false);
        setShowReceiptModal(false);
        setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Hardware barcode scanner detection (rapid keystrokes buffer)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalScan = (e) => {
      // Ignore if user is typing in customer details input
      if (e.target.tagName === 'INPUT' && e.target !== searchInputRef.current) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 2) {
          processScannedBarcode(barcodeBuffer.trim());
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        // Typical barcode scanners emit characters with < 50ms gap
        if (timeDiff < 60) {
          barcodeBuffer += e.key;
        } else {
          barcodeBuffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalScan);
    return () => window.removeEventListener('keydown', handleGlobalScan);
  }, [products]);

  // Process a scanned or entered barcode string
  const processScannedBarcode = (code) => {
    if (!code) return;
    const cleanCode = code.toLowerCase().trim();
    
    // 1. Check exact barcode match
    let match = products.find(p => p.barcode?.toLowerCase() === cleanCode);
    
    // 2. Check exact SKU match
    if (!match) {
      match = products.find(p => p.sku?.toLowerCase() === cleanCode);
    }
    
    // 3. Check exact Name match
    if (!match) {
      match = products.find(p => p.name?.toLowerCase() === cleanCode);
    }

    // 4. Fallback: single search result match
    if (!match) {
      const candidates = products.filter(p => 
        p.barcode?.toLowerCase().includes(cleanCode) || 
        p.sku?.toLowerCase().includes(cleanCode) || 
        p.name?.toLowerCase().includes(cleanCode)
      );
      if (candidates.length === 1) {
        match = candidates[0];
      }
    }

    if (match) {
      addToCart(match);
      setSearchQuery('');
      toast.success(`Scanned: ${match.name}`, { icon: '⚡' });
    } else {
      toast.error(`Barcode / SKU "${code}" not found in inventory`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      processScannedBarcode(searchQuery.trim());
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.name?.toLowerCase().includes(q) || 
      p.sku?.toLowerCase().includes(q) || 
      p.barcode?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    playScanBeep();

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          toast.error(`Only ${product.stock} units available in stock`);
          return prev;
        }
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        price: parseFloat(product.sellingPrice || 0),
        buyingPrice: parseFloat(product.buyingPrice || 0),
        gstPercent: parseFloat(product.gstPercent || 0),
        unit: product.unit || 'pcs',
        batchNumber: product.batchNumber || '',
        expiryDate: product.expiryDate || '',
        maxStock: product.stock,
        qty: 1,
        total: parseFloat(product.sellingPrice || 0)
      }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) {
          toast.error(`Maximum available stock is ${item.maxStock}`);
          return item;
        }
        return { ...item, qty: newQty, total: newQty * item.price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setDiscountPercent(0);
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHeld = [
      ...heldCarts,
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerName: customerName || 'Walk-in',
        cart,
        discountPercent
      }
    ];
    setHeldCarts(newHeld);
    localStorage.setItem(`held_carts_${companyId}`, JSON.stringify(newHeld));
    clearCart();
    toast.success('Cart held in queue (F7)');
  };

  const handleRetrieveCart = (heldItem) => {
    if (cart.length > 0) {
      if (!window.confirm('Replace current cart with held cart?')) return;
    }
    setCart(heldItem.cart);
    setCustomerName(heldItem.customerName || 'Walk-in Customer');
    setDiscountPercent(heldItem.discountPercent || 0);
    const updated = heldCarts.filter(h => h.id !== heldItem.id);
    setHeldCarts(updated);
    localStorage.setItem(`held_carts_${companyId}`, JSON.stringify(updated));
    toast.success('Cart retrieved');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableSubtotal = subtotal - discountAmount;
  
  const totalTax = cart.reduce((sum, item) => {
    const itemDiscounted = item.price * (1 - discountPercent / 100);
    const tax = (itemDiscounted * item.qty * item.gstPercent) / (100 + item.gstPercent);
    return sum + tax;
  }, 0);

  const grandTotal = Math.round(taxableSubtotal);
  const roundOff = (grandTotal - taxableSubtotal).toFixed(2);

  const handleOpenTender = () => {
    setCashAmount(grandTotal);
    setUpiAmount(0);
    setCardAmount(0);
    setPaymentMode('Cash');
    setShowTenderModal(true);
  };

  const quickCashCheckout = async () => {
    await processCheckout({
      mode: 'Cash',
      tendered: { cash: grandTotal, upi: 0, card: 0 }
    });
  };

  const processCheckout = async (paymentDetails) => {
    try {
      setLoading(true);
      const invoiceNo = `POS-${Date.now().toString().slice(-6)}`;
      
      const invoiceData = {
        companyId,
        invoiceNumber: invoiceNo,
        invoiceNo,
        date: new Date(),
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || '',
        items: cart.map(i => ({
          productId: i.id,
          name: i.name,
          sku: i.sku,
          price: i.price,
          buyingPrice: i.buyingPrice,
          qty: i.qty,
          quantity: i.qty,
          gstPercent: i.gstPercent,
          unit: i.unit,
          batchNumber: i.batchNumber,
          total: i.total
        })),
        subtotal,
        discountPercent,
        discountAmount,
        totalTax,
        roundOff: parseFloat(roundOff),
        grandTotal,
        total: grandTotal,
        saleType: paymentDetails.mode,
        paymentDetails,
        cashier: userData?.name || 'Cashier',
        source: 'POS'
      };

      const docRef = await addDoc(collection(db, 'sales'), invoiceData);

      // Decrement inventory stock
      for (const item of cart) {
        const prodRef = doc(db, 'products', item.id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const curStock = prodSnap.data().stock || 0;
          await updateDoc(prodRef, {
            stock: Math.max(0, curStock - item.qty),
            updatedAt: new Date()
          });
        }
      }

      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
        }
        return p;
      }));

      setLastInvoice({ id: docRef.id, ...invoiceData });
      setShowTenderModal(false);
      setShowReceiptModal(true);
      clearCart();
      toast.success(`Invoice ${invoiceNo} completed!`);

      if (posConfig.autoPrint) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to complete transaction');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 flex flex-col font-sans select-none">
      
      {/* ================= POS TOP NAVBAR ================= */}
      <header className="h-14 bg-white dark:bg-[#121215] border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-5 flex items-center justify-between shrink-0 shadow-sm z-30">
        
        {/* Left: Exit to Dashboard & Store Info */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            title="Exit POS & Return to Dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg transition-colors border border-slate-200 dark:border-zinc-700 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit POS</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                {companyProfile?.companyName || 'Coreventory Retail POS'}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Terminal Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Clock & Quick Keyboard Cheatsheet */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 px-3 py-1 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-inner">
            {currentTime.toLocaleTimeString()} · {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-zinc-300">F2</span> Find
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-zinc-300 ml-1">F4</span> Pay
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-zinc-300 ml-1">F7</span> Hold
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 font-mono text-[10px] font-semibold text-slate-700 dark:text-zinc-300 ml-1">F9</span> Cash
          </div>
        </div>

        {/* Right: Actions, Held Carts & Cashier Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {heldCarts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/80 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {heldCarts.length} Held
              </span>
              <div className="flex gap-1">
                {heldCarts.map((h, i) => (
                  <button
                    key={h.id}
                    onClick={() => handleRetrieveCart(h)}
                    className="text-[10px] px-1.5 py-0.5 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-800/80 dark:hover:bg-amber-700 font-bold rounded text-amber-900 dark:text-amber-100"
                    title={`Retrieve Cart from ${h.time}`}
                  >
                    #{i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sound Effect Toggle */}
          <button
            onClick={() => updatePosConfig({ soundEnabled: !posConfig.soundEnabled })}
            title={posConfig.soundEnabled ? "Barcode audio beep on" : "Barcode audio beep off"}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {posConfig.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen Mode"}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* POS Terminal Settings */}
          <button
            onClick={() => setShowSettingsModal(true)}
            title="POS Terminal Configuration"
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 mx-0.5" />

          {/* Cashier Badge */}
          <div className="flex items-center gap-2 pl-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 px-2 py-1 rounded-lg">
            <div className="w-5 h-5 rounded bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
              {(userData?.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-tight truncate max-w-[90px]">
                {userData?.name || 'Cashier'}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 leading-none">
                Cashier
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN POS BODY ================= */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        
        {/* LEFT COLUMN: ITEM SEARCH & PRODUCT GRID (70% Width) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121215] rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
          
          {/* Search & Category Tabs */}
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800 space-y-2.5 shrink-0 bg-slate-50/40 dark:bg-zinc-900/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or search by item name, SKU (Press F2 to focus)..."
                className="w-full h-9 pl-9 pr-16 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-zinc-100 shadow-sm"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 flex items-center gap-1 pointer-events-none">
                <Barcode className="w-3.5 h-3.5" /> F2
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Touchscreen Product Grid */}
          <div className="flex-1 p-3 overflow-y-auto">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
                Loading product catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <Barcode className="w-8 h-8 mb-1.5 opacity-40" />
                <p className="font-semibold">No matching products</p>
                <span className="text-slate-500 text-[11px] mt-0.5">Try searching with a different keyword or barcode</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {filteredProducts.map(prod => {
                  const inCartItem = cart.find(c => c.id === prod.id);
                  const isOutOfStock = (prod.stock || 0) <= 0;

                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      disabled={isOutOfStock}
                      className={`relative flex flex-col justify-between p-3 rounded-lg border text-left transition-all active:scale-[0.98] ${
                        isOutOfStock 
                          ? 'opacity-40 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 cursor-not-allowed'
                          : inCartItem
                            ? 'bg-slate-50 dark:bg-zinc-800/90 border-slate-900 dark:border-zinc-300 shadow-sm'
                            : 'bg-white dark:bg-zinc-900/70 border-slate-200/90 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-600 hover:shadow-sm'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-[10px] font-bold shadow">
                          {inCartItem.qty}
                        </span>
                      )}

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                          {prod.category || 'General'}
                        </span>
                        <h4 className="font-semibold text-slate-900 dark:text-zinc-100 text-xs line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-950 dark:text-white tabular-nums">
                          {formatCurrency(prod.sellingPrice || 0)}
                        </span>
                        <span className={`text-[10px] font-medium ${prod.stock <= 5 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                          {prod.stock} {prod.unit || 'pcs'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BILLING TERMINAL & CART DRAWER (30% Width) */}
        <div className="w-88 xl:w-96 flex flex-col bg-white dark:bg-[#121215] rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-sm shrink-0">
          
          {/* Customer Input Row */}
          <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="input-field h-8 text-xs"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone Number"
                className="input-field h-8 text-xs"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Barcode className="w-10 h-10 mb-2 stroke-1 opacity-30" />
                <p className="font-semibold text-slate-500 dark:text-zinc-400">Cart is empty</p>
                <span className="text-[11px] text-slate-400 mt-0.5 text-center">Scan barcodes or click items on the left to start billing</span>
              </div>
            ) : (
              cart.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-slate-50/70 dark:bg-zinc-900/60 rounded-lg border border-slate-200/70 dark:border-zinc-800 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{item.name}</p>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 tabular-nums">
                      {formatCurrency(item.price)} × {item.qty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-5 h-5 bg-white dark:bg-zinc-800 border rounded flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-950 dark:text-white tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-5 h-5 bg-white dark:bg-zinc-800 border rounded flex items-center justify-center font-bold text-slate-700 dark:text-zinc-300"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-20 text-right flex items-center justify-end gap-2 pl-2">
                    <span className="font-bold text-slate-950 dark:text-white tabular-nums">
                      {formatCurrency(item.total)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Denominations (If enabled in config) */}
          {posConfig.quickCashButtons && cart.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Fast:</span>
              {[100, 200, 500, 2000].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setPaymentMode('Cash');
                    setCashAmount(val);
                    setShowTenderModal(true);
                  }}
                  className="px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-zinc-800 border rounded text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
                >
                  ₹{val}
                </button>
              ))}
              <button
                onClick={quickCashCheckout}
                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
              >
                Exact (₹{grandTotal})
              </button>
            </div>
          )}

          {/* Totals & Action Buttons */}
          <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/50 space-y-2 text-xs shrink-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span>Items ({cart.reduce((s, i) => s + i.qty, 0)})</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Discount (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                className="w-14 px-1.5 py-0.5 text-right bg-white dark:bg-zinc-900 border rounded text-xs font-semibold"
              />
            </div>

            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
              <span>GST Included</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300 tabular-nums">
                {formatCurrency(totalTax)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Due</span>
                <span className="text-2xl font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleHoldCart}
                  disabled={cart.length === 0}
                  className="btn-secondary py-1.5 px-2 text-xs"
                  title="Hold Cart (F7)"
                >
                  <Clock className="w-3.5 h-3.5" /> Hold
                </button>

                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={quickCashCheckout}
                disabled={cart.length === 0 || loading}
                className="btn-secondary py-2.5 font-bold text-xs"
              >
                <DollarSign className="w-3.5 h-3.5" /> Cash (F9)
              </button>

              <button
                onClick={handleOpenTender}
                disabled={cart.length === 0 || loading}
                className="btn-primary py-2.5 font-bold text-xs"
              >
                <CreditCard className="w-3.5 h-3.5" /> Pay & Tender (F4)
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ================= TENDER CHECKOUT MODAL ================= */}
      {showTenderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-sm rounded-xl p-5 shadow-2xl border border-slate-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Checkout Tender</h3>
                <p className="text-xs text-slate-500">Payable Amount: <strong className="text-slate-950 dark:text-white">{formatCurrency(grandTotal)}</strong></p>
              </div>
              <button onClick={() => setShowTenderModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {['Cash', 'UPI', 'Card', 'Split'].map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setPaymentMode(mode);
                    if (mode === 'Cash') { setCashAmount(grandTotal); setUpiAmount(0); setCardAmount(0); }
                    if (mode === 'UPI') { setUpiAmount(grandTotal); setCashAmount(0); setCardAmount(0); }
                    if (mode === 'Card') { setCardAmount(grandTotal); setCashAmount(0); setUpiAmount(0); }
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    paymentMode === mode 
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900' 
                      : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {paymentMode === 'Split' ? (
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Cash (₹)</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">UPI / QR (₹)</label>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Card / POS Terminal (₹)</label>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>
            ) : paymentMode === 'UPI' && companyProfile?.upiId ? (
              <div className="flex flex-col items-center p-3 bg-slate-50 dark:bg-zinc-900 rounded-lg border text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                    generateUPIString({
                      upiId: companyProfile.upiId,
                      payeeName: companyProfile.companyName,
                      amount: grandTotal
                    })
                  )}`}
                  alt="UPI QR Code"
                  className="w-32 h-32 mb-1.5 bg-white p-1 rounded border shadow-sm"
                />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">{companyProfile.upiId}</span>
              </div>
            ) : null}

            <button
              onClick={() => processCheckout({
                mode: paymentMode,
                tendered: { cash: cashAmount, upi: upiAmount, card: cardAmount }
              })}
              disabled={paymentMode === 'Split' && (cashAmount + upiAmount + cardAmount !== grandTotal)}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Complete Sale & Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* ================= RECEIPT PRINT MODAL ================= */}
      {showReceiptModal && lastInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-sm rounded-xl p-5 shadow-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">Sale Receipt #{lastInvoice.invoiceNo}</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div id="pos-print-area" className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-lg font-mono text-[11px] text-slate-800 dark:text-zinc-200 space-y-1.5 border border-slate-200 dark:border-zinc-800">
              <div className="text-center">
                <p className="font-bold text-xs uppercase">{companyProfile?.companyName || 'Coreventory Store'}</p>
                <p className="text-[10px] text-slate-500">{companyProfile?.address || 'Retail Counter'}</p>
                {companyProfile?.gstin && <p className="text-[10px] text-slate-500">GSTIN: {companyProfile.gstin}</p>}
                <div className="border-b border-dashed border-slate-300 my-1.5" />
              </div>

              <div className="flex justify-between text-[10px]">
                <span>Bill: {lastInvoice.invoiceNo}</span>
                <span>{new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <p className="text-[10px]">Customer: {lastInvoice.customerName}</p>

              <div className="border-b border-dashed border-slate-300 my-1.5" />

              <table className="w-full text-[10px]">
                <tbody>
                  {lastInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5">{item.name} x {item.qty}</td>
                      <td className="text-right py-0.5 font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-0.5 text-[10px]">
                <div className="flex justify-between font-bold text-xs pt-1">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(lastInvoice.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Payment:</span>
                  <span>{lastInvoice.saleType}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                Thank you for your visit!
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handlePrint} className="btn-primary flex-1 py-2 text-xs font-bold">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="btn-secondary py-2 text-xs">
                Done (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POS SETTINGS MODAL ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] w-full max-w-md rounded-xl p-5 shadow-2xl border border-slate-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">POS Terminal Configuration</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Default Receipt Format
                </label>
                <select
                  value={posConfig.receiptFormat}
                  onChange={(e) => updatePosConfig({ receiptFormat: e.target.value })}
                  className="input-field font-medium"
                >
                  <option value="thermal80">Thermal POS Printer (80mm / 3 inch)</option>
                  <option value="thermal58">Compact Thermal Printer (58mm / 2 inch)</option>
                  <option value="a4">Standard Desktop A4 / A5 Layout</option>
                </select>
              </div>

              <div className="pt-2 border-t space-y-2">
                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 block">Auto-Print on Checkout</span>
                    <span className="text-[10px] text-slate-400">Instantly open system print dialog after sale</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={posConfig.autoPrint}
                    onChange={(e) => updatePosConfig({ autoPrint: e.target.checked })}
                    className="rounded text-slate-900 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 block">Barcode Audio Beep</span>
                    <span className="text-[10px] text-slate-400">Play tone when items are scanned or added</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={posConfig.soundEnabled}
                    onChange={(e) => updatePosConfig({ soundEnabled: e.target.checked })}
                    className="rounded text-slate-900 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900 rounded-lg cursor-pointer">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100 block">Fast Cash Preset Buttons</span>
                    <span className="text-[10px] text-slate-400">Show ₹100, ₹200, ₹500 tender buttons in cart</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={posConfig.quickCashButtons}
                    onChange={(e) => updatePosConfig({ quickCashButtons: e.target.checked })}
                    className="rounded text-slate-900 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSBilling;
