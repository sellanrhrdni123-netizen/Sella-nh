'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Trash2,
  Receipt,
  Search,
  Filter,
  X,
  CreditCard
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Transaction, Wallet, Category, TransactionType } from '@/lib/types';
import { formatIDR, formatWIBDate, formatWIBTime } from '@/lib/utils';

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWalletId, setFormWalletId] = useState('');
  const [formDestWalletId, setFormDestWalletId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));

  const loadData = () => {
    const u = store.getCurrentUser();
    const w = store.getWallets(u.id);
    const c = store.getCategories(u.id);
    const t = store.getTransactions(u.id);
    setWallets(w);
    setCategories(c);
    setTransactions(t);

    if (w.length > 0 && !formWalletId) setFormWalletId(w[0].id);
    if (w.length > 1 && !formDestWalletId) setFormDestWalletId(w[1].id);
    if (c.length > 0 && !formCategoryId) setFormCategoryId(c[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = store.getCurrentUser();
    const amountNum = parseFloat(formAmount.replace(/\D/g, ''));
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal yang valid');
      return;
    }

    if (formType === 'transfer' && formWalletId === formDestWalletId) {
      alert('Dompet asal dan dompet tujuan tidak boleh sama');
      return;
    }

    store.addTransaction({
      userId: u.id,
      walletId: formWalletId,
      destinationWalletId: formType === 'transfer' ? formDestWalletId : undefined,
      categoryId: formType !== 'transfer' ? formCategoryId : undefined,
      type: formType,
      amount: amountNum,
      description: formDescription.trim() || (formType === 'transfer' ? 'Transfer Antar Dompet' : 'Transaksi Web'),
      source: 'web',
      transactionDate: `${formDate}T12:00:00+07:00`
    });

    setIsModalOpen(false);
    setFormAmount('');
    setFormDescription('');
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini? Saldo dompet akan disesuaikan kembali.')) {
      store.deleteTransaction(id);
      loadData();
    }
  };

  const filtered = transactions.filter(t => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.merchantName?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brand-500" />
            <span>Pencatatan Transaksi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengeluaran, pemasukan, dan transfer dana antar dompet Anda.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Transaksi Baru</span>
        </button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedType === 'expense' ? 'bg-red-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedType === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setSelectedType('transfer')}
            className={`px-3 py-1.5 rounded-lg transition ${selectedType === 'transfer' ? 'bg-blue-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Transfer
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tanggal (WIB)</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Dompet</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                const wal = wallets.find(w => w.id === t.walletId);
                const destWal = t.destinationWalletId ? wallets.find(w => w.id === t.destinationWalletId) : null;
                const isIncome = t.type === 'income';
                const isTransfer = t.type === 'transfer';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatWIBDate(t.transactionDate)}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
                      {isTransfer ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          <ArrowRightLeft className="h-3 w-3" /> Transfer
                        </span>
                      ) : cat ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          <span>{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {isTransfer && destWal ? (
                        <span>{wal?.name} → {destWal.name}</span>
                      ) : (
                        wal?.name || 'Dompet'
                      )}
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
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Hapus transaksi"
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Catat Transaksi Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`py-2 rounded-xl font-bold border transition ${formType === 'expense' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`py-2 rounded-xl font-bold border transition ${formType === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('transfer')}
                  className={`py-2 rounded-xl font-bold border transition ${formType === 'transfer' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  Transfer
                </button>
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  required
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-extrabold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Makan siang rendang"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Wallet Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {formType === 'transfer' ? 'Dari Dompet (Asal)' : 'Dompet / Rekening'}
                </label>
                <select
                  value={formWalletId}
                  onChange={e => setFormWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                  ))}
                </select>
              </div>

              {/* Destination Wallet for Transfer */}
              {formType === 'transfer' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ke Dompet (Tujuan)</label>
                  <select
                    value={formDestWalletId}
                    onChange={e => setFormDestWalletId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category (if not transfer) */}
              {formType !== 'transfer' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formCategoryId}
                    onChange={e => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    {categories.filter(c => c.type === formType).map(c => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 transition"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
