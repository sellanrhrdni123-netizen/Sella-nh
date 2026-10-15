'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Bot,
  Filter,
  Receipt,
  Sparkles
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile, Wallet, Category, Budget, Transaction } from '@/lib/types';
import { formatIDR, formatWIBDate } from '@/lib/utils';
import { TelegramSimulator } from '@/components/telegram/TelegramSimulator';
import { getBrowserClient } from '@/lib/supabase/client';
import { OnboardingWizardModal } from '@/components/dashboard/OnboardingWizardModal';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'hari' | 'minggu' | 'bulan' | 'tahun' | 'custom'>('bulan');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showSimulator, setShowSimulator] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  const loadData = () => {
    const u = store.getCurrentUser();
    setUser(u);
    setWallets(store.getWallets(u.id));
    setCategories(store.getCategories(u.id));
    const currentMonth = new Date().toISOString().substring(0, 7);
    setBudgets(store.getBudgets(u.id, currentMonth));
    setTransactions(store.getTransactions(u.id));
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime channel subscription for live transaction & wallet updates
    const client = getBrowserClient();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('dashboard_realtime_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'wallets' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Dashboard realtime subscription warning:', err);
      }
    }

    // Offline & local storage sync listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tatadana_state_v1') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (client && channel) {
        client.removeChannel(channel);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Filter transactions based on selected period
  const now = new Date();
  const currentMonthStr = now.toISOString().substring(0, 7);

  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.transactionDate);
    if (period === 'hari') {
      return txDate.toISOString().substring(0, 10) === now.toISOString().substring(0, 10);
    } else if (period === 'minggu') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return txDate >= sevenDaysAgo;
    } else if (period === 'bulan') {
      return t.transactionDate.startsWith(currentMonthStr);
    } else if (period === 'tahun') {
      return txDate.getFullYear() === now.getFullYear();
    } else if (period === 'custom') {
      const txDay = t.transactionDate.substring(0, 10);
      if (customStart && txDay < customStart) return false;
      if (customEnd && txDay > customEnd) return false;
      return true;
    }
    return true;
  });

  // 1. Total Balance
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // 2. Income & Expense this period
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Remaining Budget this month
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const thisMonthExpenses = transactions
    .filter(t => t.type === 'expense' && t.transactionDate.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const remainingBudget = Math.max(0, totalBudgetAmount - thisMonthExpenses);

  // Top Categories for Expense Breakdown
  const categoryExpenses: { [key: string]: { name: string; emoji: string; color: string; amount: number } } = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const id = cat ? cat.id : 'other';
      const name = cat ? cat.name : 'Lainnya';
      const emoji = cat ? cat.emoji : '🏷️';
      const color = cat ? cat.color : '#F97316';

      if (!categoryExpenses[id]) {
        categoryExpenses[id] = { name, emoji, color, amount: 0 };
      }
      categoryExpenses[id].amount += t.amount;
    });

  const sortedCategories = Object.values(categoryExpenses).sort((a, b) => b.amount - a.amount);

  // 6 Months Historical Bar Data dynamically computed from user transactions
  const sixMonthsData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString('id-ID', { month: 'short' });

    const inTotal = transactions
      .filter(t => t.type === 'income' && t.transactionDate.startsWith(yyyyMm))
      .reduce((sum, t) => sum + t.amount, 0);

    const outTotal = transactions
      .filter(t => t.type === 'expense' && t.transactionDate.startsWith(yyyyMm))
      .reduce((sum, t) => sum + t.amount, 0);

    sixMonthsData.push({
      month: monthName,
      in: inTotal,
      out: outTotal
    });
  }
  const maxSixMonths = Math.max(1000000, ...sixMonthsData.flatMap(d => [d.in, d.out]));

  // Daily Spending Trend (last 7 days) dynamically computed from user transactions
  const dailyTrendData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayIso = d.toISOString().substring(0, 10);
    const dayLabel = `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleDateString('id-ID', { month: 'short' })}`;

    const dayExpense = transactions
      .filter(t => t.type === 'expense' && t.transactionDate.startsWith(dayIso))
      .reduce((sum, t) => sum + t.amount, 0);

    dailyTrendData.push({
      day: dayLabel,
      amount: dayExpense
    });
  }
  const maxDaily = Math.max(100000, ...dailyTrendData.map(d => d.amount));

  // Onboarding Checklist
  const onboardingSteps = [
    { title: 'Hubungkan Telegram Bot', completed: Boolean(user?.telegramConnected), link: '/dashboard/settings' },
    { title: 'Setup 8 Kategori Finansial AI', completed: categories.some(c => c.isCustom), link: '/dashboard/onboarding' },
    { title: 'Atur Dompet Rekening Utama', completed: wallets.length > 0, link: '/dashboard/wallet' },
    { title: 'Tentukan Budget Pengeluaran Bulanan', completed: budgets.length > 0, link: '/dashboard/budget' },
    { title: 'Catat Transaksi Pertama via Chat Telegram', completed: transactions.length > 0, link: '/dashboard/transaksi' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.completed).length;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Halo, {user?.fullName || 'Budi'}! 👋
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
              WIB (Asia/Jakarta)
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Pantau arus kas, sisa budget, dan transaksi otomatis dari Telegram kamu secara real-time.
          </p>
        </div>

        {/* Quick Actions & Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-xs">
            {(['hari', 'minggu', 'bulan', 'tahun', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                  period === p
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'hari' ? 'Hari Ini' : p === 'minggu' ? 'Mingguan' : p === 'bulan' ? 'Bulanan' : p === 'tahun' ? 'Tahunan' : 'Custom'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOnboardingWizard(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-brand-700 px-3.5 py-2 text-xs font-bold transition"
            >
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span>AI Wizard Kategori</span>
            </button>

            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition"
            >
              <Bot className="h-4 w-4 text-brand-400" />
              <span>{showSimulator ? 'Tutup Simulator Bot' : 'Buka Simulator Bot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker when Custom selected */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-orange-50/70 border border-brand-200 text-xs">
          <span className="font-bold text-slate-800">Rentang Tanggal Custom:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Mulai:</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Sampai:</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
            />
          </div>
        </div>
      )}

      {/* Simulator Overlay / Drawer if toggled */}
      {showSimulator && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-brand-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <h3 className="font-bold text-sm text-brand-900">Interactive Telegram Bot Tester</h3>
              <span className="text-[11px] text-brand-700">Setiap pesan yang dicatat di simulator langsung memperbarui saldo dan grafik dashboard!</span>
            </div>
            <button
              onClick={() => setShowSimulator(false)}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 underline"
            >
              Tutup
            </button>
          </div>
          <TelegramSimulator onTransactionAdded={loadData} />
        </div>
      )}

      {/* 4 Stats Cards (Part 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:border-brand-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Total</span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition">
              <WalletIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatIDR(totalBalance)}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" /> +4.2%
            </span>
            <span>dari {wallets.length} dompet aktif</span>
          </div>
        </div>

        {/* Card 2: Pemasukan Periode Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pemasukan</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600 tracking-tight">
            {formatIDR(totalIncome)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Periode: <strong className="capitalize">{period} ini</strong>
          </div>
        </div>

        {/* Card 3: Pengeluaran Periode Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:border-red-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pengeluaran</span>
            <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-red-600 tracking-tight">
            {formatIDR(totalExpense)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            {filteredTransactions.filter(t => t.type === 'expense').length} transaksi pengeluaran
          </div>
        </div>

        {/* Card 4: Budget Tersisa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:border-brand-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Budget Tersisa</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatIDR(remainingBudget)}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            dari total alokasi {formatIDR(totalBudgetAmount)}
          </div>
        </div>
      </div>

      {/* Onboarding Checklist for new users */}
      {completedSteps < onboardingSteps.length && (
        <div className="bg-white rounded-2xl p-6 border border-brand-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Checklist Memulai TataDana</h3>
              <p className="text-xs text-slate-500">Selesaikan langkah berikut agar pengalaman pencatatan keuanganmu maksimal ({completedSteps}/{onboardingSteps.length} selesai)</p>
            </div>
            <div className="w-36 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-brand-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {onboardingSteps.map((step, idx) => (
              <Link
                key={idx}
                href={step.link}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                  step.completed
                    ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                    : 'bg-orange-50/40 border-brand-200 text-slate-800 hover:border-brand-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-brand-500 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${step.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {step.title}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid: Bar Chart 6 Bulan & Pie Chart Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Bar Chart 6 Bulan Terakhir & Trend Line */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Arus Kas 6 Bulan Terakhir</h3>
              <p className="text-xs text-slate-500">Perbandingan pemasukan vs pengeluaran (Mei - Oktober 2026)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-3 w-3 rounded bg-emerald-500"></span> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-3 w-3 rounded bg-brand-500"></span> Pengeluaran
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
            {sixMonthsData.map((d, i) => {
              const inHeightPct = Math.min(100, Math.max(d.in > 0 ? 6 : 0, Math.round((d.in / maxSixMonths) * 100)));
              const outHeightPct = Math.min(100, Math.max(d.out > 0 ? 6 : 0, Math.round((d.out / maxSixMonths) * 100)));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-44">
                    {/* Income Bar */}
                    <div
                      className="w-1/3 bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition relative"
                      style={{ height: `${inHeightPct}%` }}
                      title={`Pemasukan: ${formatIDR(d.in)}`}
                    ></div>
                    {/* Expense Bar */}
                    <div
                      className="w-1/3 bg-brand-500 rounded-t-md hover:bg-brand-600 transition relative"
                      style={{ height: `${outHeightPct}%` }}
                      title={`Pengeluaran: ${formatIDR(d.out)}`}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900">{d.month}</span>
                </div>
              );
            })}
          </div>

          {/* Daily Trend Sparkline (Trend Line Pengeluaran Harian Bulan Ini) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Trend Pengeluaran Harian (7 Hari Terakhir)</span>
              <span className="text-xs text-slate-400">Puncak: {formatIDR(maxDaily)}</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-16 pt-2">
              {dailyTrendData.map((day, idx) => {
                const heightPct = Math.max(10, Math.round((day.amount / maxDaily) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className="w-full bg-brand-200 group-hover:bg-brand-500 rounded-t transition"
                      style={{ height: `${heightPct}%` }}
                      title={`${day.day}: ${formatIDR(day.amount)}`}
                    ></div>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-700 truncate w-full text-center">
                      {day.day.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right (1 col): Pie Chart Pengeluaran Per Kategori */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Kategori Pengeluaran</h3>
              <PieChartIcon className="h-4 w-4 text-brand-500" />
            </div>
            <p className="text-xs text-slate-500 mb-4">Distribusi pengeluaran berdasarkan kategori bulan ini</p>

            {/* Category Bars Breakdown */}
            <div className="space-y-3.5">
              {sortedCategories.slice(0, 5).map((cat, idx) => {
                const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                      </span>
                      <span className="font-bold text-slate-900">{formatIDR(cat.amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {sortedCategories.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada transaksi pengeluaran pada periode ini.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Lihat rincian lengkap:</span>
            <Link href="/dashboard/laporan" className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>Ke Halaman Laporan</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 10 Transaksi Terbaru */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">10 Transaksi Terbaru</h3>
            <p className="text-xs text-slate-500">Tercatat otomatis dari Telegram Bot dan Web</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/transaksi"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Lihat Semua Transaksi</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-slate-100">
              <tr>
                <th className="py-3 px-3">Tanggal (WIB)</th>
                <th className="py-3 px-3">Catatan / Deskripsi</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Dompet</th>
                <th className="py-3 px-3">Sumber</th>
                <th className="py-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 10).map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const wal = wallets.find(w => w.id === t.walletId);
                const isIncome = t.type === 'income';
                const isTransfer = t.type === 'transfer';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {formatWIBDate(t.transactionDate)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{t.description}</div>
                      {t.receiptItems && t.receiptItems.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 font-medium">
                          <Receipt className="h-3 w-3" /> Struk: {t.receiptItems.length} item
                        </span>
                      )}
                      {t.transcriptText && (
                        <span className="block text-[10px] text-amber-600 italic">
                          🎙️ "{t.transcriptText}"
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {cat ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          <span>{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {wal?.name || 'Dompet'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.source.startsWith('telegram')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.source === 'telegram_text' ? '🤖 TG Teks' :
                         t.source === 'telegram_photo' ? '📸 TG Foto' :
                         t.source === 'telegram_voice' ? '🎙️ TG VN' : '💻 Web'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold whitespace-nowrap">
                      <span
                        className={
                          isIncome
                            ? 'text-emerald-600'
                            : isTransfer
                            ? 'text-blue-600'
                            : 'text-slate-900'
                        }
                      >
                        {isIncome ? '+ ' : isTransfer ? '⇄ ' : '- '}
                        {formatIDR(t.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada transaksi. Buka simulator bot untuk mencoba mencatat!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive AI Category Onboarding Wizard Modal */}
      <OnboardingWizardModal
        isOpen={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        onCompleted={loadData}
      />
    </div>
  );
}
