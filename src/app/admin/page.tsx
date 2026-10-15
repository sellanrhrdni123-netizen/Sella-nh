'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Cpu,
  CreditCard,
  Terminal,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { store } from '@/lib/storage';
import { formatIDR } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [usersCount, setUsersCount] = useState(0);
  const [aiCallsCount, setAiCallsCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [activeProvidersCount, setActiveProvidersCount] = useState(0);

  useEffect(() => {
    setUsersCount(store.getProfiles().length);
    setAiCallsCount(store.getAILogs().length);
    setPendingPaymentsCount(store.getPayments().filter(p => p.status === 'pending').length);
    setActiveProvidersCount(store.getAIConfigs().filter(c => c.isActive).length);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Superadmin Dashboard TataDana</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pusat kendali infrastruktur AI multi-provider, manajemen pengguna, verifikasi pembayaran Midtrans, dan audit privasi.
        </p>
      </div>

      {/* 4 Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total Pengguna</span>
            <Users className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white mt-3">{usersCount}</p>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Semua akun terdaftar</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Provider AI Aktif</span>
            <Cpu className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white mt-3">{activeProvidersCount} Model</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Gemini, GPT-4o, DeepSeek</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total AI Queries</span>
            <Terminal className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-white mt-3">{aiCallsCount}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Rata-rata latensi: 420ms</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Antrean Pembayaran</span>
            <CreditCard className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-3">{pendingPaymentsCount}</p>
          <span className="text-[11px] text-amber-300/80 mt-1 block">Menunggu verifikasi admin</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/providers"
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <Cpu className="h-6 w-6 text-amber-500" />
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition" />
          </div>
          <h3 className="font-bold text-sm text-white mt-3">Konfigurasi Multi-Provider AI</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ubah kunci API terenkripsi, alihkan mode single ke parallel/failover, dan sesuaikan prioritas model.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <Users className="h-6 w-6 text-amber-500" />
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition" />
          </div>
          <h3 className="font-bold text-sm text-white mt-3">Impersonasi & Kelola Pengguna</h3>
          <p className="text-xs text-slate-400 mt-1">
            Masuk ke tampilan dashboard user secara live tanpa butuh password untuk customer support.
          </p>
        </Link>

        <Link
          href="/admin/payments"
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition group"
        >
          <div className="flex items-center justify-between">
            <CreditCard className="h-6 w-6 text-amber-500" />
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition" />
          </div>
          <h3 className="font-bold text-sm text-white mt-3">Approval Pembayaran Manual</h3>
          <p className="text-xs text-slate-400 mt-1">
            Tinjau bukti struk transfer bank dari user dan setujui upgrade paket Pro secara instan.
          </p>
        </Link>
      </div>
    </div>
  );
}
