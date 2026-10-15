'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Cpu,
  Users,
  Terminal,
  CreditCard,
  Search,
  ArrowLeft,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Verify Superadmin Authentication & Role
    const checkAuth = () => {
      // Check cookies and store state
      const roleCookie = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('tatadana_auth_role='))?.split('=')[1]
        : null;

      const userCookie = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(row => row.startsWith('tatadana_auth_user='))?.split('=')[1]
        : null;

      const adminUserRecord = store.getAdminUser();
      const currentUser = store.getCurrentUser();

      const hasAdminAuth =
        roleCookie === 'admin' ||
        roleCookie === 'superadmin' ||
        userCookie === 'usr_admin_tatadana_01' ||
        currentUser.role === 'admin' ||
        (currentUser as any).role === 'superadmin';

      if (!hasAdminAuth) {
        // If not authorized as superadmin, redirect to login
        setIsAuthorized(false);
        const redirectTimer = setTimeout(() => {
          router.push(`/login?redirectTo=${encodeURIComponent(pathname)}&error=unauthorized_admin`);
        }, 800);
        return () => clearTimeout(redirectTimer);
      } else {
        setIsAuthorized(true);
        setAdminUser(adminUserRecord);
        setImpersonatingId(store.getImpersonatingUserId());
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleDevAuthenticateAdmin = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'tatadana_auth_role=admin; path=/; max-age=86400';
      document.cookie = 'tatadana_auth_user=usr_admin_tatadana_01; path=/; max-age=86400';
    }
    const admin = store.getAdminUser();
    setAdminUser(admin);
    setIsAuthorized(true);
  };

  const handleExitImpersonation = () => {
    store.setImpersonation(null);
    setImpersonatingId(null);
    router.refresh();
  };

  const handleLogout = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'tatadana_auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'tatadana_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    router.push('/login');
  };

  // While checking auth
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 animate-spin">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-slate-300">Memverifikasi Hak Akses Superadmin...</p>
      </div>
    );
  }

  // Unauthorized state
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-white">Akses Ditolak (Unauthorized)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Halaman ini berada di bawah perlindungan ketat Superadmin TataDana. Akun Anda tidak memiliki role yang diizinkan untuk mengakses modul ini. Mengalihkan ke halaman login...
          </p>

          <div className="pt-2 space-y-2">
            <button
              onClick={handleDevAuthenticateAdmin}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
            >
              Masuk Cepat sebagai Superadmin (Dev Mode)
            </button>
            <Link
              href="/login"
              className="block w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const adminNav = [
    { label: 'Ringkasan Admin', href: '/admin', icon: LayoutDashboard },
    { label: 'AI Multi-Provider', href: '/admin/providers', icon: Cpu },
    { label: 'Kelola Pengguna', href: '/admin/users', icon: Users },
    { label: 'Log Aktivitas AI', href: '/admin/ai-logs', icon: Terminal },
    { label: 'Verifikasi Pembayaran', href: '/admin/payments', icon: CreditCard },
    { label: 'Inspeksi Transaksi (Audit)', href: '/admin/transactions', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Impersonation Alert Banner for Admin */}
      {impersonatingId && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>
              Impersonasi Aktif: Anda sedang melihat konteks user <u>{impersonatingId}</u>.
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="rounded-lg bg-slate-950 text-white px-3 py-1 text-[11px] font-black hover:bg-slate-800 transition"
          >
            Hentikan Impersonasi
          </button>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className={`md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 ${impersonatingId ? 'mt-9' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-base text-white">
            Tata<span className="text-amber-500">Admin</span>
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
          aria-label="Toggle admin navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:static'
        } ${impersonatingId ? 'pt-8 md:pt-10' : ''}`}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold shadow-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">
                Tata<span className="text-amber-500">Admin</span>
              </span>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Superadmin Console</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Superadmin Badge */}
        <div className="px-4 py-3 mx-4 my-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white text-[11px] truncate">
              {adminUser?.fullName || 'Sella Nurhardiani (Administrator Utama)'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate">{adminUser?.email || 'sellanrhrdni123@gmail.com'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {adminNav.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-2">
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition border border-amber-500/40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Portal Terpadu Hub 🎯</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke App User</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 text-xs font-bold transition border border-red-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar Superadmin</span>
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className={`flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl ${impersonatingId ? 'pt-14 md:pt-16' : ''}`}>
        {children}
      </main>
    </div>
  );
}
