'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Receipt,
  Calendar,
  Lock,
  History,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Transaction, Wallet, Category, ExportRecord, UserProfile } from '@/lib/types';
import { formatIDR, formatWIBDate, formatWIBTime } from '@/lib/utils';
import {
  generatePDFReport,
  generateExcelReport,
  calculateReportSummary,
  uploadAndRecordExport,
  getSignedExportUrl,
  fetchExportHistory
} from '@/lib/export';
import { getBrowserClient } from '@/lib/supabase/client';

export default function LaporanPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'semua' | 'bulan_ini' | 'bulan_lalu' | 'custom'>('bulan_ini');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category' | 'wallet'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Expanded multi-item receipt state
  const [expandedReceiptIds, setExpandedReceiptIds] = useState<Set<string>>(new Set());

  // Generating status
  const [isExporting, setIsExporting] = useState<'pdf' | 'xlsx' | null>(null);

  const loadData = async () => {
    const u = store.getCurrentUser();
    setUser(u);
    setTransactions(store.getTransactions(u.id));
    setWallets(store.getWallets(u.id));
    setCategories(store.getCategories(u.id));
    const history = await fetchExportHistory(u.id);
    setExportHistory(history);
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime Channel Subscription for live transactions and report exports
    const client = getBrowserClient();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel('laporan_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'report_exports' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error in laporan:', err);
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tatadana_state_v1') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (client && channel) {
        client.removeChannel(channel);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Filter logic
  const filtered = transactions.filter(t => {
    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Wallet filter
    if (walletFilter !== 'all' && t.walletId !== walletFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;

    // Search term in description or merchant
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchMerchant = t.merchantName?.toLowerCase().includes(q);
      if (!matchDesc && !matchMerchant) return false;
    }

    // Date filter
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    if (dateFilter === 'bulan_ini') {
      if (!t.transactionDate.startsWith(currentMonth)) return false;
    } else if (dateFilter === 'bulan_lalu') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
      if (!t.transactionDate.startsWith(prevMonthStr)) return false;
    } else if (dateFilter === 'custom') {
      const txDay = t.transactionDate.substring(0, 10);
      if (startDate && txDay < startDate) return false;
      if (endDate && txDay > endDate) return false;
    }

    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'date') {
      comp = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
    } else if (sortBy === 'amount') {
      comp = a.amount - b.amount;
    } else if (sortBy === 'category') {
      const catA = categories.find(c => c.id === a.categoryId)?.name || '';
      const catB = categories.find(c => c.id === b.categoryId)?.name || '';
      comp = catA.localeCompare(catB);
    } else if (sortBy === 'wallet') {
      const walA = wallets.find(w => w.id === a.walletId)?.name || '';
      const walB = wallets.find(w => w.id === b.walletId)?.name || '';
      comp = walA.localeCompare(walB);
    }
    return sortOrder === 'desc' ? -comp : comp;
  });

  // Pagination logic
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedTransactions = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Summary
  const summary = calculateReportSummary(filtered, categories);

  const toggleExpandReceipt = (id: string) => {
    const next = new Set(expandedReceiptIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedReceiptIds(next);
  };

  const handleExportPDF = async () => {
    if (!user) return;
    if (user.plan === 'starter') {
      alert('Export PDF & Excel hanya tersedia untuk paket Pro. Silakan upgrade paket Anda.');
      return;
    }

    setIsExporting('pdf');
    try {
      const periodLabel = dateFilter === 'bulan_ini' ? 'Bulan Ini (Oktober 2026)' : dateFilter === 'bulan_lalu' ? 'Bulan Lalu' : dateFilter === 'custom' ? `${startDate || 'Awal'} s/d ${endDate || 'Akhir'}` : 'Semua Periode';
      const periodStart = dateFilter === 'custom' && startDate ? new Date(startDate).toISOString() : null;
      const periodEnd = dateFilter === 'custom' && endDate ? new Date(endDate).toISOString() : null;

      const { doc, fileName, fileSize, buffer } = generatePDFReport(filtered, wallets, categories, user.fullName, periodLabel);

      // Trigger instant browser download
      doc.save(fileName);

      // Upload to Supabase Storage bucket tatadana-exports & record in report_exports table
      await uploadAndRecordExport({
        userId: user.id,
        fileName,
        fileType: 'pdf',
        buffer,
        fileSize,
        periodLabel,
        periodStart,
        periodEnd
      });

      // Refresh export history with latest signed URLs
      const history = await fetchExportHistory(user.id);
      setExportHistory(history);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!user) return;
    if (user.plan === 'starter') {
      alert('Export PDF & Excel hanya tersedia untuk paket Pro. Silakan upgrade paket Anda.');
      return;
    }

    setIsExporting('xlsx');
    try {
      const periodLabel = dateFilter === 'bulan_ini' ? 'Bulan Ini (Oktober 2026)' : dateFilter === 'bulan_lalu' ? 'Bulan Lalu' : dateFilter === 'custom' ? `${startDate || 'Awal'} s/d ${endDate || 'Akhir'}` : 'Semua Periode';
      const periodStart = dateFilter === 'custom' && startDate ? new Date(startDate).toISOString() : null;
      const periodEnd = dateFilter === 'custom' && endDate ? new Date(endDate).toISOString() : null;

      const { fileName, buffer } = generateExcelReport(filtered, wallets, categories, user.fullName, periodLabel);

      // Trigger instant browser download via blob
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Upload to Supabase Storage bucket tatadana-exports & record in report_exports table
      await uploadAndRecordExport({
        userId: user.id,
        fileName,
        fileType: 'xlsx',
        buffer,
        fileSize: buffer.length,
        periodLabel,
        periodStart,
        periodEnd
      });

      // Refresh export history with latest signed URLs
      const history = await fetchExportHistory(user.id);
      setExportHistory(history);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleReDownloadExport = async (exp: ExportRecord) => {
    try {
      // 1. Check for 24h signed URL or generate a fresh signed URL from Supabase Storage
      let signedUrl = exp.downloadUrl;
      if (!signedUrl || signedUrl.startsWith('exports/')) {
        const freshUrl = await getSignedExportUrl(exp.userId, exp.fileName);
        if (freshUrl) signedUrl = freshUrl;
      }

      if (signedUrl && (signedUrl.startsWith('http://') || signedUrl.startsWith('https://'))) {
        window.open(signedUrl, '_blank');
        return;
      }

      // 2. Fallback to client-side regeneration if offline / local mock
      if (exp.format === 'pdf') {
        const { doc } = generatePDFReport(filtered, wallets, categories, user?.fullName || 'Budi Pratama', exp.periodLabel);
        doc.save(exp.fileName);
      } else {
        const { buffer } = generateExcelReport(filtered, wallets, categories, user?.fullName || 'Budi Pratama', exp.periodLabel);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exp.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Re-download export error:', e);
    }
  };

  const isPro = user?.plan === 'pro';

  return (
    <div className="space-y-6">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-500" />
            <span>Laporan Keuangan & Arus Kas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lihat riwayat transaksi lengkap, rincian per item struk, dan ekspor ke PDF & Excel on-demand.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>{isExporting === 'pdf' ? 'Generating PDF...' : 'Export PDF'}</span>
            {!isPro && <Lock className="h-3 w-3 ml-1 text-red-200" />}
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting !== null}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{isExporting === 'xlsx' ? 'Generating Excel...' : 'Export Excel (.xlsx)'}</span>
            {!isPro && <Lock className="h-3 w-3 ml-1 text-emerald-200" />}
          </button>
        </div>
      </div>

      {/* Plan Notice if Starter */}
      {!isPro && (
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Fitur Laporan Terbatas di Paket Starter:</strong> Filter lanjutan, rincian per item struk, dan ekspor unlimited ke PDF/Excel tersedia di paket <strong>Pro</strong>.
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-lg bg-amber-600 text-white px-3 py-1 font-bold hover:bg-amber-700 shrink-0 ml-4 transition"
          >
            Upgrade ke Pro
          </Link>
        </div>
      )}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pemasukan</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">{formatIDR(summary.totalIncome)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Periode terpilih</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pengeluaran</span>
          <p className="text-xl font-extrabold text-red-600 mt-2">{formatIDR(summary.totalExpense)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Periode terpilih</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Net Cashflow</span>
          <p className={`text-xl font-extrabold mt-2 ${summary.netCashflow >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
            {formatIDR(summary.netCashflow)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">{filtered.length} transaksi tercatat</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Top 5 Pengeluaran</span>
          {summary.topCategories.length > 0 ? (
            <div className="mt-1 space-y-0.5">
              <p className="text-sm font-bold text-slate-900 truncate" title={summary.topCategories[0].name}>
                {summary.topCategories[0].name}
              </p>
              <p className="text-xs font-semibold text-brand-600">
                {formatIDR(summary.topCategories[0].amount)} ({summary.topCategories[0].percentage}%)
              </p>
              <span className="text-[10px] text-slate-400 block">Porsi terbesar periode ini</span>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-400 mt-2">-</p>
          )}
        </div>
      </div>

      {/* Top 5 Pengeluaran Breakdown Bar Widget */}
      {summary.topCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Rincian Top 5 Pengeluaran Berdasarkan Kategori</span>
            </span>
            <span className="text-xs text-slate-400">Total: {formatIDR(summary.totalExpense)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {summary.topCategories.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate" title={cat.name}>
                    #{idx + 1} {cat.name}
                  </span>
                  <span className="text-brand-600 font-bold ml-1">{cat.percentage}%</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900">
                  {formatIDR(cat.amount)}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan catatan atau merchant..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Quick Period Selector */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => { setDateFilter('bulan_ini'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${dateFilter === 'bulan_ini' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => { setDateFilter('bulan_lalu'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${dateFilter === 'bulan_lalu' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => { setDateFilter('semua'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${dateFilter === 'semua' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Semua Periode
            </button>
            <button
              onClick={() => { setDateFilter('custom'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${dateFilter === 'custom' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Rentang Tanggal
            </button>
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-orange-50/60 border border-brand-200 text-xs">
            <span className="font-bold text-slate-700">Filter Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs"
              />
            </div>
          </div>
        )}

        {/* Detailed Dropdowns (Type, Wallet, Category) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Jenis Transaksi</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran Saja</option>
              <option value="income">Pemasukan Saja</option>
              <option value="transfer">Transfer Saja</option>
            </select>
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Dompet / Rekening</label>
            <select
              value={walletFilter}
              onChange={e => { setWalletFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaksi Table with Sortable Columns & Expandable Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th
                  className={`py-3 px-4 cursor-pointer select-none transition ${sortBy === 'date' ? 'text-brand-600 bg-orange-50/60' : 'hover:text-slate-900'}`}
                  onClick={() => {
                    if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('date'); setSortOrder('desc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tanggal</span>
                    {sortBy === 'date' ? (
                      <span className="text-xs font-black text-brand-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Deskripsi / Struk</th>
                <th
                  className={`py-3 px-4 cursor-pointer select-none transition ${sortBy === 'category' ? 'text-brand-600 bg-orange-50/60' : 'hover:text-slate-900'}`}
                  onClick={() => {
                    if (sortBy === 'category') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('category'); setSortOrder('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kategori</span>
                    {sortBy === 'category' ? (
                      <span className="text-xs font-black text-brand-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th
                  className={`py-3 px-4 cursor-pointer select-none transition ${sortBy === 'wallet' ? 'text-brand-600 bg-orange-50/60' : 'hover:text-slate-900'}`}
                  onClick={() => {
                    if (sortBy === 'wallet') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('wallet'); setSortOrder('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dompet</span>
                    {sortBy === 'wallet' ? (
                      <span className="text-xs font-black text-brand-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Sumber</th>
                <th
                  className={`py-3 px-4 text-right cursor-pointer select-none transition ${sortBy === 'amount' ? 'text-brand-600 bg-orange-50/60' : 'hover:text-slate-900'}`}
                  onClick={() => {
                    if (sortBy === 'amount') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('amount'); setSortOrder('desc'); }
                  }}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Nominal</span>
                    {sortBy === 'amount' ? (
                      <span className="text-xs font-black text-brand-600">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const wal = wallets.find(w => w.id === t.walletId);
                const hasReceiptItems = t.receiptItems && t.receiptItems.length > 0;
                const isExpanded = expandedReceiptIds.has(t.id);

                return (
                  <React.Fragment key={t.id}>
                    <tr className={`hover:bg-slate-50/70 transition ${isExpanded ? 'bg-orange-50/30' : ''}`}>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatWIBDate(t.transactionDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span>{t.description}</span>
                          {hasReceiptItems && (
                            <button
                              onClick={() => toggleExpandReceipt(t.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 text-brand-700 px-2 py-0.5 text-[10px] font-bold hover:bg-orange-200 transition"
                            >
                              <Receipt className="h-3 w-3" />
                              <span>Lihat Rincian Item ({t.receiptItems!.length})</span>
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                        {t.merchantName && (
                          <span className="text-[11px] text-slate-500">Merchant: {t.merchantName}</span>
                        )}
                        {t.transcriptText && (
                          <span className="block text-[10px] text-amber-600 italic">
                            🎙️ "{t.transcriptText}"
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {cat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                            <span>{cat.emoji}</span>
                            <span>{cat.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {wal?.name || 'Dompet'}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                        <span
                          className={
                            t.type === 'income'
                              ? 'text-emerald-600'
                              : t.type === 'transfer'
                              ? 'text-blue-600'
                              : 'text-slate-900'
                          }
                        >
                          {t.type === 'income' ? '+ ' : t.type === 'transfer' ? '⇄ ' : '- '}
                          {formatIDR(t.amount)}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Multi-item Receipt Row (Part 3) */}
                    {hasReceiptItems && isExpanded && (
                      <tr className="bg-orange-50/40 border-y border-orange-100">
                        <td colSpan={6} className="p-4">
                          <div className="bg-white rounded-xl p-3.5 border border-orange-200/80 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                              <span className="flex items-center gap-1.5 text-brand-600">
                                <Receipt className="h-4 w-4" />
                                <span>Rincian Item dari Foto Struk ({t.merchantName || 'Toko'})</span>
                              </span>
                              <span className="text-slate-500 font-normal">Satu transaksi utama dipecah detail per item</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {t.receiptItems!.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                                  <div>
                                    <span className="font-semibold text-slate-800">{item.name}</span>
                                    {item.categoryName && (
                                      <span className="block text-[10px] text-slate-400">{item.categoryName}</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-900">{formatIDR(item.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <span>
            Menampilkan {sorted.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sorted.length)} dari {sorted.length} transaksi
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              Sebelumnya
            </button>
            <span className="px-2 font-semibold">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Export Tersimpan (Part 3) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <History className="h-4 w-4 text-brand-500" />
              <span>Riwayat Export Laporan</span>
            </h3>
            <p className="text-xs text-slate-500">File hasil ekspor sebelumnya tersimpan di Supabase Storage dan bisa didownload ulang tanpa generate ulang</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{exportHistory.length} file</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {exportHistory.map(exp => (
            <div key={exp.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${exp.format === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {exp.format === 'pdf' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{exp.fileName}</p>
                  <p className="text-[11px] text-slate-400">Periode: {exp.periodLabel} • Ukuran: {Math.round(exp.fileSizeBytes / 1024)} KB</p>
                </div>
              </div>

              <button
                onClick={() => handleReDownloadExport(exp)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 font-semibold transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Ulang</span>
              </button>
            </div>
          ))}

          {exportHistory.length === 0 && (
            <div className="py-4 text-center text-slate-400 text-xs">
              Belum ada riwayat export file laporan. Klik tombol "Export PDF" atau "Export Excel" di atas untuk men-generate laporan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
