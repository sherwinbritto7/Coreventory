import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Loader2,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  PackageCheck,
  FileCheck2,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import lightlogo from '../../assets/lightlogo.png';
import darklogo from '../../assets/darklogo.png';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to Coreventory');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-slate-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Left Side: What is Coreventory (Information & Highlights) */}
        <motion.div 
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-7 space-y-6 lg:pr-6"
        >
          {/* Logo */}
          <div className="flex items-center">
            <img src={lightlogo} alt="Coreventory" className="h-14 sm:h-16 lg:h-[70px] w-auto object-contain dark:hidden block" />
            <img src={darklogo} alt="Coreventory" className="h-14 sm:h-16 lg:h-[70px] w-auto object-contain hidden dark:block" />
          </div>

          {/* Value Proposition */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">
              The Intelligent Business OS for Billing, Inventory & GST.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Coreventory is a multi-tenant Cloud ERP designed for Indian retailers, wholesalers, and distributors. Replace scattered spreadsheets with instant counter billing, automated GST compliance, and real-time stock control.
            </p>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold">High-Speed POS Billing</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Continuous barcode gun scanning, hotkeys, split tender, and instant 58mm/80mm thermal receipts.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <PackageCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-semibold">Smart Inventory Control</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Multi-godown transfers, dual-unit conversion (Boxes ⇄ Pcs), and FEFO batch & expiry alerts.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <FileCheck2 className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold">Official GST Compliance</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Auto Place-of-Supply detection, portal-ready GSTR-1 JSON/CSV exports, and E-Way bill generation.
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
                <Landmark className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-semibold">Accounting & Cash Flow</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                Multi-bank accounts, Contra vouchers, expense ITC claims, and WhatsApp payment reminders.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Minimal Auth Card */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800/90 rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-5">
            
            {/* Header */}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 mb-1">
                Sign in to Store Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Enter your authorized credentials to access your tenant store
              </p>
            </div>

            {/* Admin Provisioning Notice */}
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-lg flex items-start gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0" />
              <span>
                Access is restricted. Tenant business accounts and staff roles are provisioned by the <strong>Super Admin</strong>.
              </span>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="input-field pl-9 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-semibold mt-2 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Trust & Security Footnote */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Multi-Tenant Cloud &middot; 256-bit SSL Encryption</span>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Login;
