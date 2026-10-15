'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Receipt,
  BarChart3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Play,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Mic,
  Camera,
  MessageSquare,
  Lock
} from 'lucide-react';
import { TelegramSimulator } from '@/components/telegram/TelegramSimulator';

export default function LandingPage() {
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'lifetime'>('lifetime');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Bagaimana cara menghubungkan Telegram saya dengan TataDana?',
      a: 'Sangat mudah! Setelah mendaftar di web TataDana dan memverifikasi nomor HP, Anda cukup memasukkan token bot dari @BotFather di menu Pengaturan, lalu klik "Test Koneksi". Sistem kami otomatis mendaftarkan webhook dan menautkan akun Anda dalam hitungan detik.'
    },
    {
      q: 'Apakah bisa menggunakan fitur foto struk di paket Starter?',
      a: 'Tidak. Fitur input foto struk dengan AI Vision OCR adalah fitur eksklusif paket Pro. Pengguna paket Starter dapat mencatat transaksi sepuasnya via teks natural dan Voice Note (VN) Telegram.'
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Data Anda 100% aman tersimpan di Supabase Postgres dengan enkripsi standar industri dan Row Level Security (RLS). Tidak ada pihak ketiga yang memiliki akses ke transaksi Anda, dan kunci API disimpan dengan enkripsi khusus.'
    },
    {
      q: 'Format bahasa apa saja yang bisa dipahami oleh bot Telegram TataDana?',
      a: 'TataDana memahami 100% bahasa Indonesia natural dan ragam format angka lokal, seperti: "beli bakso 15rb", "kopi susu 22k gopay", "gajian 7.5jt", "isi bensin pertamax 50rb", serta pesan suara (Voice Note).'
    },
    {
      q: 'Apakah saya bisa mengekspor laporan transaksi ke PDF dan Excel?',
      a: 'Ya! Di dashboard Laporan TataDana, pengguna Pro dapat mengekspor ringkasan keuangan dan rincian transaksi lengkap ke file PDF dan Excel (.xlsx) on-demand kapan saja tanpa batasan.'
    },
    {
      q: 'Bagaimana cara kerja AI Financial Advisor?',
      a: 'AI Financial Advisor (fitur Pro) bekerja otomatis tanpa perlu diketik khusus. AI akan langsung memberikan analisis dan saran personal di chat Telegram saat pengeluaran kategori naik >50% dibanding minggu lalu, pengeluaran bulanan >80% dari pemasukan, atau ada pengeluaran tunggal yang besar (>20% budget).'
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami menerima pembayaran otomatis melalui Midtrans (QRIS GoPay, OVO, ShopeePay, BCA/Mandiri Virtual Account) serta opsi transfer bank manual dengan konfirmasi dari dashboard admin.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* 0. PROMINENT UNIFIED PORTAL BANNER */}
      <div className="bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 text-white py-2 px-4 text-center text-xs font-bold shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span>🌟</span>
            <span>Portal Terpadu Aktif: 1 Link Terhubung ke Seluruh 6 Fitur TataDana</span>
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Link
              href="/portal"
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition shadow-xs"
            >
              Buka Portal Terpadu 🎯
            </Link>
          </div>
        </div>
      </div>

      {/* 1. NAVBAR — Sticky, Logo, Menu, Masuk & Coba Gratis (Part 7) */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-500/20">
              T
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Tata<span className="text-brand-500">Dana</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <Link href="/portal" className="text-brand-600 font-bold hover:text-brand-700 transition flex items-center gap-1">
              <span>🎯 Portal Terpadu</span>
            </Link>
            <a href="#fitur" className="hover:text-brand-600 transition">Fitur Unggulan</a>
            <a href="#demo" className="hover:text-brand-600 transition">Coba Simulator</a>
            <a href="#harga" className="hover:text-brand-600 transition">Harga Paket</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
            >
              Semua Fitur
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 transition"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* 2-6. HERO SECTION (Part 7) */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        {/* Pre-headline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-bold shadow-xs">
          <span>✨ Catat keuangan langsung dari Telegram</span>
        </div>

        {/* Headline (H1) with orange gradient */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          Gaji habis sebelum akhir bulan?{' '}
          <span className="orange-gradient-text block mt-1">
            Sudah saatnya kamu tahu ke mana uangmu pergi.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/portal"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xl transition flex items-center justify-center gap-2"
          >
            <span>🎯 Buka Portal Semua Fitur</span>
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-sm shadow-xl shadow-brand-500/25 transition flex items-center justify-center gap-2"
          >
            <span>Mulai Gratis Sekarang</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition"
          >
            Lihat cara kerjanya →
          </a>
        </div>

        {/* Hero Section Video Placeholder (Part 7: TODO: ganti dengan video asli) */}
        {/* TODO: ganti dengan video asli setelah produksi company demo video selesai */}
        <div className="mt-12 rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-2xl relative aspect-video max-w-4xl mx-auto flex items-center justify-center group">
          <img
            src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
            alt="Demo Video Placeholder TataDana"
            className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-3">
            <div className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/40 cursor-pointer group-hover:scale-110 transition">
              <Play className="h-7 w-7 text-white fill-white ml-1" />
            </div>
            <p className="font-bold text-sm text-slate-200 tracking-wide">
              Tonton Demo Cara Kerja TataDana Bot (1 Menit)
            </p>
            <span className="text-[11px] text-brand-300 font-mono">
              [Placeholder Video Demo — TODO: ganti dengan video asli]
            </span>
          </div>
        </div>
      </section>

      {/* 2.5. EMBEDDED UNIFIED FEATURE MATRIX TABLE */}
      <section className="py-12 bg-white px-4 sm:px-6 lg:px-8 border-b border-slate-100" id="portal-matrix">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              HUB KONEKTIVITAS TERPADU
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Semua Fitur TataDana Terhubung Dalam 1 Link Utama
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Akses, uji, dan kelola seluruh fitur SaaS dan Bot Telegram secara langsung dari link portal utama.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 min-w-[180px]">Fitur</th>
                    <th className="py-3 px-4 min-w-[150px]">Endpoint</th>
                    <th className="py-3 px-4 min-w-[240px]">Keterangan</th>
                    <th className="py-3 px-4 min-w-[110px]">Status</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Aksi Langsung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">1</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">🌐 Landing Page Fintech</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">Showcase produk, live interactive demo chat, pricing, FAQ.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Online</span></td>
                    <td className="py-3.5 px-4 text-right"><a href="#demo" className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 transition">Lihat Demo ↓</a></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">2</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">💬 Bot Telegram Simulator</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/dev/telegram-simulator</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">Chat natural language WIB ("beli bakso 15rb"), foto struk OCR, voice note STT.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">🟢 Siap Uji</span></td>
                    <td className="py-3.5 px-4 text-right"><Link href="/dev/telegram-simulator" className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-xs text-white transition">Uji Bot ⚡</Link></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">3</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">📊 Web Dashboard Keuangan</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/dashboard</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">4 stats cards saldo total, pemasukan, pengeluaran, budget & 4 multi-wallet.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Realtime</span></td>
                    <td className="py-3.5 px-4 text-right"><Link href="/dashboard" className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-xs text-white transition">Buka Dashboard 📊</Link></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">4</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">📑 Modul Laporan & Export</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/dashboard/reports</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">Tabel riwayat transaksi, accordion rincian struk belanja, ekspor PDF & Excel.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">🟢 Siap Unduh</span></td>
                    <td className="py-3.5 px-4 text-right"><Link href="/dashboard/reports" className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-xs text-white transition">Laporan 📥</Link></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">5</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">⚙️ Superadmin Console</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/admin</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">AI Multi-Provider (Gemini, OpenAI, DeepSeek), monitoring Midtrans, audit logs.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">🟢 Superadmin</span></td>
                    <td className="py-3.5 px-4 text-right"><Link href="/admin" className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-xs text-white transition">Superadmin ⚙️</Link></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-brand-600 text-center">6</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">⚡ Webhook Tester & Data</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-brand-700"><code>/api/telegram/webhook</code></td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">GUI Webhook tester (kirim payload JSON Telegram, uji idempoten) & raw JSON.</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">🟢 API Ready</span></td>
                    <td className="py-3.5 px-4 text-right"><Link href="/api/telegram/webhook" className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 font-bold text-xs text-white transition">Uji Webhook 🚀</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 7-8. PROBLEM BULLET POINTS & SOLUTION TRANSITION (Part 7) */}
      <section className="py-20 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Apakah Ini Sering Terjadi Pada Kamu?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tantangan Finansial yang Dihadapi Karyawan & Freelancer Indonesia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
                🥱
              </div>
              <h3 className="font-bold text-base text-slate-900">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aplikasi keuangan konvensional terlalu ribet: harus login, pilih form panjang, ketik tanggal. Akhirnya malas mencatat dan uang menguap begitu saja.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                💸
              </div>
              <h3 className="font-bold text-base text-slate-900">
                "Kok uangnya habis ya? Padahal tidak beli apa-apa..."
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pengeluaran kecil seperti kopi kekinian, jajan sore, parkir, dan ongkir tak pernah tercatat. Tahu-tahu saldo rekening tinggal puluhan ribu di pertengahan bulan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center font-bold text-lg">
                📉
              </div>
              <h3 className="font-bold text-base text-slate-900">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tanpa pengingat otomatis dan trigger langsung, budget yang rapi di Excel hanya jadi pajangan karena tidak dipantau saat transaksi terjadi.
              </p>
            </div>
          </div>

          {/* Solution Transition */}
          <div className="text-center pt-8 space-y-3">
            <p className="text-lg font-semibold text-slate-700">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </p>
            <h3 className="text-3xl font-black orange-gradient-text">
              Introducing TataDana
            </h3>
          </div>
        </div>
      </section>

      {/* 9. INTERACTIVE DASHBOARD & TELEGRAM PREVIEW (Part 7) */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Interactive Live Demo
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Coba Langsung Bot Telegram TataDana
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Ketik contoh transaksi seperti <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">beli bakso 15rb</code> atau klik tombol di bawah untuk melihat bagaimana bot merespons dalam format WIB dan progress bar asli!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left (7 cols): Telegram Bot Live Simulator */}
          <div className="lg:col-span-7">
            <TelegramSimulator />
          </div>

          {/* Right (5 cols): Preview Kartu Finansial Realtime */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-500" />
                <span>Format Balasan Asli Bot Telegram</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Balasan diformat persis standar fintech dengan tanggal WIB, emoji kategori, dan status budget.
              </p>
            </div>

            <div className="rounded-xl bg-white p-4 border border-slate-200 font-mono text-xs text-slate-800 space-y-1 shadow-xs">
              <p className="text-slate-400">📅 Selasa, 13 Oktober 2026 — 14:35 WIB</p>
              <p className="text-red-600 font-bold">💸 Pengeluaran tercatat!</p>
              <p>├ Nominal : Rp15.000</p>
              <p>├ Kategori : 🍜 Makanan & Minuman</p>
              <p>├ Dompet   : 👛 BCA Utama</p>
              <p>├ Catatan  : Beli bakso</p>
              <p>└ Saldo    : Rp14.485.000</p>
              <div className="pt-2 text-slate-600">
                <p>📊 Budget Makanan bulan ini:</p>
                <p className="text-brand-600 font-bold">[████████░░] 78% — sisa Rp550.000</p>
                <p className="text-[11px] text-slate-500 font-sans mt-1">✨ Pengeluaran masih aman dalam batas budget bulanan.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/70 border border-brand-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-brand-900 block">Kecerdasan Buatan (LLM Parser):</span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                AI TataDana memahami parsing nominal khas Indonesia: <strong>15rb</strong> = 15.000, <strong>500k</strong> = 500.000, <strong>1.5jt</strong> = 1.500.000, dan menempatkan kategori yang paling cocok secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FITUR SECTION (3 Alternating Layout Features - Part 7) */}
      <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Solusi Terpadu
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Fitur Cerdas untuk Kendali Finansial Penuh
            </h2>
          </div>

          {/* Feature 1: Catat via Telegram (Teks, VN, Foto Struk) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Fitur 01</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Catat Transaksi Semudah Chatting di Telegram
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tinggalkan form manual yang melelahkan. Cukup kirim pesan teks, rekaman suara (Voice Note), atau foto struk belanjaan di Indomaret/resto. AI Vision kami membaca semua item rincian dan mencatatnya ke dompet Anda secara instan.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Parsing teks pintar: "gajian 7.5jt", "beli bensin 50rb"</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Transkripsi Voice Note cepat dengan AI Speech-to-Text</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> OCR Foto Struk multi-item (khusus paket Pro)</li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white p-5">
              <img
                src="https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=800&q=80"
                alt="Foto Struk OCR"
                className="rounded-xl w-full h-64 object-cover"
              />
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">Struk Indomaret Point (5 item terdeteksi)</span>
                <span className="text-brand-600 font-extrabold">Rp142.500</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Laporan & Export Otomatis di Dashboard (Alternating Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-white p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-extrabold text-sm text-slate-900">Dashboard Laporan Finansial</span>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">Supabase Realtime</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between font-semibold">
                  <span>Total Pemasukan Bulan Ini</span>
                  <span className="text-emerald-600">Rp19.000.000</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between font-semibold">
                  <span>Total Pengeluaran Bulan Ini</span>
                  <span className="text-red-600">Rp6.200.000</span>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl flex justify-between font-bold text-brand-900">
                  <span>Net Cashflow Bersih</span>
                  <span className="text-brand-600">+Rp12.800.000</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="flex-1 p-2 rounded-lg bg-slate-100 text-center font-bold text-[11px] text-slate-700">Export PDF On-demand</div>
                <div className="flex-1 p-2 rounded-lg bg-slate-100 text-center font-bold text-[11px] text-slate-700">Export Excel (.xlsx)</div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Fitur 02</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Laporan & Export Otomatis Tanpa Ribet
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap rupiah yang dicatat via bot otomatis tersinkronisasi 100% di Supabase Postgres dan dashboard web TataDana. Anda bisa memfilter per dompet, per kategori, dan men-generate laporan PDF atau Excel (.xlsx) resmi secara on-demand kapan saja.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ringkasan arus kas & top 5 kategori pengeluaran</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Tabel transaksi interaktif dengan sortir kolom & pencarian</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Riwayat export tersimpan di Supabase Storage pribadi</li>
              </ul>
            </div>
          </div>

          {/* Feature 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Fitur 03</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                AI Financial Advisor yang Menjaga Keuanganmu 24/7
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukan sekadar buku kas pasif. AI TataDana proaktif memantau ritme belanja Anda. Saat pengeluaran suatu kategori melonjak tajam atau mendekati batas bahaya, advisor langsung memberikan saran actionable yang realistis.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Peringatan lonjakan belanja &gt;50% dibanding minggu lalu</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Proteksi pengeluaran impulsif tunggal &gt;20% budget</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Rekomendasi tabungan dan investasi realistis</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
                <Bot className="h-5 w-5" />
                <span>Pesan Advisor Otomatis (Telegram):</span>
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs space-y-2 font-mono">
                <p className="text-amber-400 font-bold">🤖 Financial Advisor</p>
                <p>Hei Budi! Pengeluaran kopi & nongkrongmu naik 62% dibanding minggu lalu (Rp340.000 vs Rp210.000).</p>
                <p className="text-emerald-400 font-bold mt-2">💡 Saran:</p>
                <p className="text-slate-300">Coba ganti 2 gelas kopi cafe dengan seduhan sendiri minggu ini agar budget tetap aman sampai gajian!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. TESTIMONIALS (Part 7: Masonry Grid Placeholder) */}
      {/* // TODO: ganti dengan testimoni asli setelah ada beta user */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            Pengalaman Pengguna
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Cerita Mereka yang Sudah Memegang Kendali Finansial
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            [Placeholder Testimoni Early Adopters — // TODO: ganti dengan ulasan user beta asli]
          </p>
        </div>

        {/* Masonry Grid Testimonial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Dulu selalu malas buka aplikasi catatan keuangan karena capek ngetik. Sejak pakai TataDana, pas bayar makan di warteg langsung chat bot: 'makan 20rb bca'. Saldo langsung update otomatis!"
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="h-9 w-9 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">
                RP
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Rian Pratama</p>
                <p className="text-[11px] text-slate-400">Software Engineer, Jakarta</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Fitur foto struk di paket Pro bener-bener game changer! Belanja bulanan di Indomaret tinggal difoto, 10 item langsung dipisah kategorinya. Nggak perlu input satu-satu lagi."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="h-9 w-9 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                NS
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Nadia Savira</p>
                <p className="text-[11px] text-slate-400">Content Creator, Bandung</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Sebagai mahasiswa yang uang jajannya pas-pasan, progress bar budget di bot Telegram ngebantu banget. Begitu budget kopi mau habis, bot langsung ngingetin buat rem belanja."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="h-9 w-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs">
                FA
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Fajar Ananda</p>
                <p className="text-[11px] text-slate-400">Mahasiswa UI, Depok</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. PRICING PLANS (Part 6 & Part 7) */}
      <section id="harga" className="py-20 bg-slate-50 border-y border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Harga Transparan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pilih Paket Sesuai Gaya Finansialmu
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Mulai hemat dengan paket Starter atau upgrade sekali bayar seumur hidup untuk fitur Pro lengkap.
            </p>
          </div>

          {/* Pricing Cycle Toggle (Part 7: Bulanan / Sekali Bayar) */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center p-1 rounded-2xl bg-slate-200/80 border border-slate-300 shadow-inner">
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                  pricingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Langganan Bulanan
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('lifetime')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition ${
                  pricingCycle === 'lifetime'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Sekali Bayar (Lifetime)</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                  HEMAT 80%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid (2 Columns: Starter | Pro) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">Langganan</span>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-slate-900">Rp49.000</span>
                  <span className="text-xs text-slate-500"> / bulan</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Cocok untuk pencatatan harian dasar karyawan & mahasiswa.
                </p>

                <div className="mt-8 space-y-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Catat transaksi via teks Telegram</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Input via Voice Note (VN) Telegram</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Dashboard web lengkap</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Maksimal 50 transaksi / bulan</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Maksimal 3 dompet, 5 budget</div>
                  <div className="flex items-center gap-2.5 text-slate-400">❌ Input via foto struk (OCR Vision)</div>
                  <div className="flex items-center gap-2.5 text-slate-400">❌ AI Financial Advisor aktif</div>
                  <div className="flex items-center gap-2.5 text-slate-400">❌ Export laporan ke PDF/Excel</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  href="/register"
                  className="block w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-center font-extrabold text-xs transition"
                >
                  Pilih Starter
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-brand-500 shadow-2xl relative flex flex-col justify-between">
              <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-brand-500 to-amber-500 text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-md">
                {pricingCycle === 'lifetime' ? 'SEKALI BAYAR SEUMUR HIDUP' : 'PRO BULANAN'}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    {pricingCycle === 'lifetime' ? 'Pro Lifetime' : 'Pro Bulanan'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">Recommended</span>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-black text-slate-900">
                    {pricingCycle === 'lifetime' ? 'Rp99.000' : 'Rp89.000'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {pricingCycle === 'lifetime' ? ' / sekali bayar' : ' / bulan'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {pricingCycle === 'lifetime'
                    ? 'Akses seumur hidup ke semua kecerdasan AI dan export tanpa batas.'
                    : 'Akses penuh tanpa komitmen jangka panjang, batalkan kapan saja.'}
                </p>

                <div className="mt-8 space-y-3 text-xs text-slate-800 font-medium">
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>Semua fitur Starter</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>Unlimited transaksi bulanan</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>Unlimited multi-wallet & kategori</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>Input via foto struk AI OCR</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>Export unlimited ke PDF & Excel (.xlsx)</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> <strong>AI Financial Advisor aktif otomatis</strong></div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Reminder custom harian</div>
                  <div className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0" /> Prioritas customer support</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  href="/register"
                  className="block w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-center font-black text-xs shadow-lg shadow-brand-500/25 transition"
                >
                  Dapatkan Akses Pro Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FAQ SECTION (>= 7 Pertanyaan Relevan - Part 7) */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Pertanyaan Umum
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-xs text-slate-500">
            Semua yang perlu kamu ketahui tentang TataDana dan integrasi bot Telegram.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 hover:text-brand-600 transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 text-brand-600 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 14. FINAL CTA SECTION (Orange Gradient Background - Part 7) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Mulai Kendalikan Keuanganmu Hari Ini.
          </h2>
          <p className="text-orange-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Bergabunglah bersama ribuan orang yang sudah berhenti bingung ke mana uang gaji mereka pergi. Cukup chat bot kami.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm shadow-xl hover:bg-slate-50 transition"
            >
              <span>Daftar Gratis Sekarang</span>
              <ArrowRight className="h-4 w-4 text-brand-600" />
            </Link>
          </div>
        </div>
      </section>

      {/* 15. FOOTER (4 Kolom - Part 7) */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Kolom 1: Logo + Tagline + Sosmed */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-base">
                T
              </div>
              <span className="font-extrabold text-base text-white">TataDana</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>
            <div className="pt-1 flex gap-3 text-slate-400">
              <span className="hover:text-white cursor-pointer">Telegram</span>
              <span className="hover:text-white cursor-pointer">Instagram</span>
              <span className="hover:text-white cursor-pointer">Twitter/X</span>
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Produk</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#fitur" className="hover:text-white transition">Telegram Bot NLP</a></li>
              <li><a href="#demo" className="hover:text-white transition">OCR Foto Struk</a></li>
              <li><a href="#fitur" className="hover:text-white transition">Laporan & Export PDF/Excel</a></li>
              <li><a href="#fitur" className="hover:text-white transition">AI Financial Advisor</a></li>
              <li><a href="#harga" className="hover:text-white transition">Daftar Harga</a></li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Perusahaan</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/" className="hover:text-white transition">Tentang TataDana</Link></li>
              <li><Link href="/admin" className="hover:text-amber-400 transition">Portal Superadmin</Link></li>
              <li><a href="#faq" className="hover:text-white transition">Bantuan & FAQ</a></li>
              <li><a href="#" className="hover:text-white transition">Karir</a></li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-[11px] uppercase tracking-wider">Legal & Keamanan</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#" className="hover:text-white transition">Kebijakan Privasi (Privacy Policy)</a></li>
              <li><a href="#" className="hover:text-white transition">Syarat & Ketentuan (Terms of Service)</a></li>
              <li><a href="#" className="hover:text-white transition">Keamanan Data Supabase</a></li>
              <li><a href="mailto:support@tatadana.id" className="hover:text-white transition">Kontak Support: support@tatadana.id</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
          © 2026 TataDana Indonesia. All rights reserved. Dibangun dengan Next.js 14, Supabase, Tailwind CSS & Telegram Bot API.
        </div>
      </footer>
    </div>
  );
}
