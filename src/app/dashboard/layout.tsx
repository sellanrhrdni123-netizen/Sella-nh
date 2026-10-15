'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet as WalletIcon,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Bot
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const u = store.getCurrentUser();
    setUser(u);
    setImpersonatingId(store.getImpersonatingUserId());
  }, [pathname]);

  const navItems = [
    { label: 'Portal Terpadu 🎯', href: '/portal', icon: Sparkles },
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Transaksi', href: '/dashboard/transaksi', icon: CreditCard },
    { label: 'Laporan', href: '/dashboard/laporan', icon: BarChart3 },
    { label: 'Budget', href: '/dashboard/budget', icon: Target },
    { label: 'Wallet', href: '/dashboard/wallet', icon: WalletIcon },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleExitImpersonation = () => {
    store.setImpersonation(null);
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Impersonation Banner if Active */}
      {impersonatingId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 px-4 py-2.5 font-bold text-xs md:text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span>👁️ Mode Tinjau: Anda sedang melihat dashboard sebagai <u>{user?.fullName || 'User'}</u> (Role Admin Aktif)</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="rounded-lg bg-slate-900 text-white px-3 py-1 text-xs font-bold hover:bg-slate-800 transition"
          >
            Kembali ke Admin Console →
          </button>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className={`md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 ${impersonatingId ? 'mt-9' : ''}`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
            T
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            Tata<span className="text-brand-500">Dana</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:static'
        } ${impersonatingId ? 'md:pt-10' : ''}`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-brand-500/20">
              T
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Tata<span className="text-brand-500">Dana</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Fintech Keuangan Pribadi</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-brand-500" />}
              </Link>
            );
          })}

          {/* Quick link to Admin if user role is admin */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-amber-50 hover:text-amber-700 transition"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span>Portal Admin TataDana</span>
            </Link>
            <Link
              href="/dev/telegram-simulator"
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition"
            >
              <Bot className="h-3.5 w-3.5 text-brand-500" />
              <span>Simulator Bot Telegram ⚡</span>
            </Link>
          </div>
        </nav>

        {/* Telegram Bot status card in sidebar */}
        <div className="p-4 mx-4 mb-4 rounded-xl bg-orange-50/70 border border-brand-200/60 text-xs">
          <div className="flex items-center gap-2 font-semibold text-brand-800 mb-1">
            <Bot className="h-3.5 w-3.5 text-brand-600" />
            <span>Telegram Bot</span>
            <span className="ml-auto inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Terhubung ke @tatadana_bot. Catat transaksi langsung dari HP kamu!
          </p>
        </div>

        {/* User Profile Card & Plan Badge */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.fullName || 'User'}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-brand-100"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.fullName || 'Budi Pratama'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user?.plan === 'pro'
                      ? 'bg-gradient-to-r from-brand-500 to-amber-500 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {user?.plan === 'pro' ? '★ Pro' : 'Starter'}
                </span>
                <span className="text-[11px] text-slate-400">IDR</span>
              </div>
            </div>
          </div>

          {/* Plan CTA if Starter */}
          {user?.plan === 'starter' && (
            <Link
              href="/dashboard/settings"
              className="block w-full text-center mb-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white py-1.5 text-xs font-semibold shadow-xs transition"
            >
              Upgrade ke Pro (Rp99k)
            </Link>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <Link href="/" className="hover:text-slate-700 flex items-center gap-1">
              <span>Landing Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <a href="/logout" className="hover:text-red-600 flex items-center gap-1">
              <LogOut className="h-3 w-3" />
              <span>Keluar</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className={`flex-1 min-w-0 p-4 md:p-8 md:overflow-y-auto ${impersonatingId ? 'pt-12 md:pt-14' : ''}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
