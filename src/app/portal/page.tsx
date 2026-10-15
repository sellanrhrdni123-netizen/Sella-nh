'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Receipt,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Activity,
  Server,
  Layers,
  ExternalLink,
  Cpu
} from 'lucide-react';

export default function UnifiedPortalPage() {
  const features = [
    {
      no: 1,
      title: 'Landing Page Fintech',
      icon: <Layers className="h-6 w-6 text-brand-500" />,
      url: '/',
      description: 'Halaman beranda SaaS TataDana lengkap dengan live interactive bot demo chat, showcase fitur, perbandingan Starter vs Pro, FAQ, dan CTA.',
      status: 'Online',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      actionText: 'Buka Landing Page →',
      actionUrl: '/'
    },
    {
      no: 2,
      title: 'Interactive Telegram Bot Simulator',
      icon: <Bot className="h-6 w-6 text-blue-500" />,
      url: '/dev/telegram-simulator',
      description: 'Simulator interaktif bot Telegram untuk menguji natural language parser WIB ("beli bakso 15rb"), foto struk OCR multi-item, voice note STT, dan bot commands.',
      status: 'Siap Uji Coba',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      actionText: 'Coba Bot Simulator ⚡',
      actionUrl: '/dev/telegram-simulator'
    },
    {
      no: 3,
      title: 'Web Dashboard & Overview Keuangan',
      icon: <BarChart3 className="h-6 w-6 text-emerald-500" />,
      url: '/dashboard',
      description: 'Dashboard ringkasan finansial dengan 4 Stats Cards (Saldo Total, Pemasukan, Pengeluaran, Sisa Budget), riwayat transaksi, dan kartu 4 multi-wallet.',
      status: 'Realtime Sync',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      actionText: 'Buka Dashboard 📊',
      actionUrl: '/dashboard'
    },
    {
      no: 4,
      title: 'Modul Laporan & Export PDF/Excel',
      icon: <FileSpreadsheet className="h-6 w-6 text-purple-500" />,
      url: '/dashboard/reports',
      description: 'Tabel transaksi lengkap dengan accordion rincian item struk belanja, filter pencarian instan, dan generator ekspor riil ke file Excel/CSV serta PDF.',
      status: 'Generator Siap',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      actionText: 'Lihat Laporan & Unduh 📑',
      actionUrl: '/dashboard/reports'
    },
    {
      no: 5,
      title: 'Superadmin Console & AI Provider Control',
      icon: <Cpu className="h-6 w-6 text-rose-500" />,
      url: '/admin',
      description: 'Pusat kendali AI Provider (Gemini Flash default, OpenAI, DeepSeek failover), monitoring antrean Midtrans, dan log audit privasi akses data transaksi.',
      status: 'Kontrol Penuh',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      actionText: 'Buka Superadmin ⚙️',
      actionUrl: '/admin'
    },
    {
      no: 6,
      title: 'Webhook API Tester & Data Real-Time',
      icon: <Zap className="h-6 w-6 text-amber-500" />,
      url: '/api/telegram/webhook',
      description: 'GUI interactive Webhook tester (kirim simulasi payload Telegram, uji idempoten dedup, tes teks/struk/voice) dan live JSON database store di /api/data.',
      status: 'Idempoten Aktif',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      actionText: 'Uji Webhook Tester 🚀',
      actionUrl: '/api/telegram/webhook'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Persistent Global Hub Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900 text-white border-b-2 border-brand-500 px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-black text-lg">
                T
              </div>
              <span className="font-extrabold text-lg tracking-tight">
                Tata<span className="text-brand-500">Dana</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Unified Portal Hub
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold py-1">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              🌐 Beranda
            </Link>
            <Link href="/dev/telegram-simulator" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              💬 Bot Simulator
            </Link>
            <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              📊 Dashboard
            </Link>
            <Link href="/dashboard/reports" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              📑 Laporan
            </Link>
            <Link href="/admin" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              ⚙️ Superadmin
            </Link>
            <Link href="/api/telegram/webhook" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition">
              ⚡ Webhook Tester
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition"
            >
              Buka Aplikasi →
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 sm:p-12 border border-slate-700 shadow-xl">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              PORTAL NAVIGASI TERPADU 1-LINK
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              TataDana Unified Portal <span className="text-brand-500">& All-in-One Hub</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Dari <b>SATU link utama</b> ini, seluruh fitur di dalam tabel dapat langsung diakses, diuji, dan dijalankan secara terpadu tanpa harus mengetik URL terpisah.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Server Standalone: Online (Port 3000)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-blue-400 font-bold flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Cloudflare Tunnel: Aktif
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400 font-bold flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Zona Waktu: WIB (Asia/Jakarta)
              </span>
            </div>
          </div>
        </div>

        {/* Feature Table Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tabel Matriks Fitur Terpadu
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Daftar lengkap 6 fitur terhubung end-to-end yang siap digunakan secara langsung.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Fitur & Modul</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Endpoint / URL</th>
                    <th className="py-3.5 px-4 min-w-[260px]">Deskripsi & Kemampuan</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                    <th className="py-3.5 px-4 text-right min-w-[140px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {features.map(f => (
                    <tr key={f.no} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 font-black text-brand-600 text-center">{f.no}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            {f.icon}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{f.title}</div>
                            <div className="text-[11px] text-slate-500">Sistem TataDana</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-brand-700 font-semibold">
                        <span className="px-2 py-1 rounded-md bg-slate-100">{f.url}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs leading-relaxed">
                        {f.description}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${f.badgeClass}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {f.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={f.actionUrl}
                          className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs transition"
                        >
                          {f.actionText}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3 Quick Jump Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <Bot className="h-7 w-7 text-brand-500" />
              <h3 className="font-extrabold text-base text-slate-900">Telegram Bot Simulator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ketik pengeluaran santai seperti "beli bakso 15rb" atau kirim foto struk untuk melihat respon instan.
              </p>
            </div>
            <Link
              href="/dev/telegram-simulator"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition"
            >
              Uji Coba Simulator →
            </Link>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <BarChart3 className="h-7 w-7 text-slate-900" />
              <h3 className="font-extrabold text-base text-slate-900">Web Dashboard & Laporan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pantau saldo total 4 dompet, rincian budget bulanan, dan ekspor riwayat transaksi ke PDF & Excel.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Buka Dashboard →
            </Link>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <Zap className="h-7 w-7 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900">Webhook Tester & Live Store</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kirim payload simulasi JSON Telegram untuk menguji verifikasi idempoten dan sinkronisasi real-time.
              </p>
            </div>
            <Link
              href="/api/telegram/webhook"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
            >
              Uji Webhook Tester →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
