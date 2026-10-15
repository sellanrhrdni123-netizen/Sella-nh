'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  X,
  Bell
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Budget, Category, Transaction } from '@/lib/types';
import { formatIDR, generateProgressBar } from '@/lib/utils';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // Edit/Set Budget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const loadData = () => {
    const u = store.getCurrentUser();
    setBudgets(store.getBudgets(u.id, currentMonth));
    setCategories(store.getCategories(u.id));
    setTransactions(store.getTransactions(u.id));
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const handleOpenBudgetModal = (catId?: string) => {
    const u = store.getCurrentUser();
    const expCats = categories.filter(c => c.type === 'expense');
    const targetCatId = catId || (expCats.length > 0 ? expCats[0].id : '');
    const existingBudget = budgets.find(b => b.categoryId === targetCatId);
    if (u.plan === 'starter' && budgets.length >= 5 && !existingBudget) {
      setIsUpgradeModalOpen(true);
      return;
    }
    if (targetCatId) setSelectedCategoryId(targetCatId);
    setIsModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const u = store.getCurrentUser();
    const existingBudget = budgets.find(b => b.categoryId === selectedCategoryId);
    if (u.plan === 'starter' && budgets.length >= 5 && !existingBudget) {
      setIsModalOpen(false);
      setIsUpgradeModalOpen(true);
      return;
    }
    const num = parseFloat(budgetAmount.replace(/\D/g, ''));
    if (!num || num <= 0 || !selectedCategoryId) {
      alert('Pilih kategori dan masukkan nominal budget yang valid');
      return;
    }

    store.setBudget(u.id, selectedCategoryId, num, currentMonth);
    setIsModalOpen(false);
    setSelectedCategoryId('');
    setBudgetAmount('');
    loadData();
  };

  // Calculate spending per budget
  const expenseTransactions = transactions.filter(
    t => t.type === 'expense' && t.transactionDate.startsWith(currentMonth)
  );

  const budgetStats = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const spent = expenseTransactions
      .filter(t => t.categoryId === b.categoryId)
      .reduce((s, t) => s + t.amount, 0);
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const remaining = Math.max(0, b.amount - spent);

    return {
      budget: b,
      category: cat,
      spent,
      percentage,
      remaining,
      isOver: spent > b.amount,
      isNearLimit: percentage >= 80 && percentage < 100
    };
  });

  const totalAllocated = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetStats.reduce((s, bs) => s + bs.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-brand-500" />
            <span>Budget Bulanan Kategori</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Atur batas pengeluaran bulananmu. Notifikasi Telegram otomatis dikirim saat mencapai 80% dan 100%.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={currentMonth}
            onChange={e => setCurrentMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
          />

          <button
            onClick={() => handleOpenBudgetModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Atur Budget</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Budget Dialokasikan</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatIDR(totalAllocated)}</p>
          <span className="text-xs text-slate-400 mt-1 block">{budgets.length} kategori dengan budget</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Terpakai Bulan Ini</span>
          <p className="text-2xl font-extrabold text-red-600 mt-2">{formatIDR(totalSpent)}</p>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% dari seluruh budget
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Sisa Budget Aman</span>
          <p className="text-2xl font-extrabold text-brand-600 mt-2">{formatIDR(Math.max(0, totalAllocated - totalSpent))}</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Siap dialokasikan ke tabungan
          </span>
        </div>
      </div>

      {/* Telegram Alert Policy Box */}
      <div className="rounded-xl p-4 bg-orange-50/70 border border-brand-200/80 flex items-start gap-3 text-xs text-slate-700">
        <Bell className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-900">Sistem Peringatan Otomatis Telegram (80% & 100%)</h4>
          <p className="text-slate-600 mt-0.5">
            Sesuai kebijakan produk TataDana, setiap transaksi yang mendorong pengeluaran kategori mencapai ambang batas 80% atau 100% akan memicu notifikasi peringatan langsung ke chat Telegram Anda beserta rekomendasi penghematan.
          </p>
        </div>
      </div>

      {/* Budget List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetStats.map(({ budget, category, spent, percentage, remaining, isOver, isNearLimit }) => {
          const asciiBar = generateProgressBar(percentage, 12);

          return (
            <div
              key={budget.id}
              className={`bg-white rounded-2xl p-5 border shadow-card transition ${
                isOver ? 'border-red-300 ring-1 ring-red-200' : isNearLimit ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100">
                    {category?.emoji || '🏷️'}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{category?.name || 'Kategori'}</h4>
                    <span className="text-xs text-slate-400">Budget: {formatIDR(budget.amount)}</span>
                  </div>
                </div>

                {isOver ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                    <AlertCircle className="h-3.5 w-3.5" /> Melebihi Budget!
                  </span>
                ) : isNearLimit ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Waspada 80%+
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aman
                  </span>
                )}
              </div>

              {/* Progress Bar & Visual ASCII representation */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Terpakai: <strong className="text-slate-900">{formatIDR(spent)}</strong>
                  </span>
                  <span className="font-extrabold text-slate-900">{percentage}%</span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  ></div>
                </div>

                {/* ASCII Progress representation as shown in Telegram */}
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Format Bot: [{asciiBar}]</span>
                  <span>Sisa: {formatIDR(remaining)}</span>
                </div>
              </div>

              {/* Edit button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCategoryId(budget.categoryId);
                    setBudgetAmount(budget.amount.toString());
                    setIsModalOpen(true);
                  }}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 transition"
                >
                  Ubah Nominal Budget
                </button>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            Belum ada budget yang diatur untuk bulan ini. Klik tombol "Atur Budget" untuk menambahkan!
          </div>
        )}
      </div>

      {/* Modal Atur Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Atur Budget Bulanan</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Pengeluaran</label>
                <select
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Batas Budget (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 1500000"
                  required
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-md shadow-brand-500/20 transition"
                >
                  Simpan Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Starter Budget Tier Limit */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Batas Budget Tercapai</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Pengguna paket <strong className="text-slate-800">Starter</strong> dibatasi maksimal <strong>5 kategori budget</strong> per bulan.
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-left text-xs text-amber-900">
                <span className="font-bold block mb-1">Keuntungan Pro:</span>
                • Atur budget untuk seluruh kategori tanpa batas<br />
                • Progress bar visual dan alert threshold real-time<br />
                • AI Financial Advisor deteksi overspending otomatis
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/dashboard/settings"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
              >
                Upgrade ke Pro (Rp99.000 Sekali Bayar)
              </a>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
